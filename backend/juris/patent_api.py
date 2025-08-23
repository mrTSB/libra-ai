#!/usr/bin/env python3
"""
Patent Search API with RAG and Exa Search Integration
Provides endpoints for patent similarity search using local corpus and web search.
"""

import os
import asyncio
import logging
import base64
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import anthropic
from exa_py import Exa
from dotenv import load_dotenv
import requests

# Add current directory to path for imports
import sys

sys.path.append(str(Path(__file__).parent))

from patent_doc_processor import PatentRAGRetriever

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for loaded models
patent_retriever: Optional[PatentRAGRetriever] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    global patent_retriever

    # Startup
    logger.info("Loading patent knowledge base...")
    try:
        current_dir = Path(__file__).parent
        pickle_path = current_dir / "patent_knowledge_base.pkl"
        patent_retriever = PatentRAGRetriever(str(pickle_path))
        logger.info("Patent knowledge base loaded successfully")
    except FileNotFoundError:
        logger.warning(
            "Patent knowledge base not found. Run setup_patent_system.py first."
        )
        patent_retriever = None
    except Exception as e:
        logger.error(f"Error loading patent knowledge base: {e}")
        patent_retriever = None

    yield

    # Shutdown
    logger.info("Shutting down patent search API")


app = FastAPI(
    title="Patent Search API",
    description="Patent similarity search with local corpus and web search",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
exa_client = None
try:
    if os.getenv("EXA_API_KEY"):
        exa_client = Exa(api_key=os.getenv("EXA_API_KEY"))
except Exception as e:
    logger.warning(f"Could not initialize Exa client: {e}")
    exa_client = None

# Initialize Anthropic client (optional)
anthropic_client = None
try:
    if os.getenv("ANTHROPIC_API_KEY"):
        anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
except Exception as e:
    logger.warning(f"Could not initialize Anthropic client: {e}")
    anthropic_client = None


# Pydantic models
class PatentDescription(BaseModel):
    """Patent description for similarity search."""

    description: str = Field(
        ..., description="Description of the patent to search for similar patents"
    )
    title: Optional[str] = Field(None, description="Optional title of the patent")
    inventor: Optional[str] = Field(None, description="Optional inventor name")
    use_web_search: bool = Field(
        True, description="Whether to include web search for similar patents"
    )
    use_local_corpus: bool = Field(
        True, description="Whether to search local patent corpus"
    )
    max_local_results: int = Field(
        5, description="Maximum number of local corpus results"
    )
    max_web_results: int = Field(5, description="Maximum number of web search results")


class PatentResult(BaseModel):
    """Individual patent search result."""

    title: str
    description: str
    source: str
    similarity_score: Optional[float] = None
    patent_number: Optional[str] = None
    filing_date: Optional[str] = None
    inventor: Optional[str] = None
    assignee: Optional[str] = None
    result_type: str  # 'local_corpus' or 'web_search'


class PatentSearchResponse(BaseModel):
    """Response for patent similarity search."""

    query_description: str
    similar_patents: List[PatentResult]
    local_results_count: int
    web_results_count: int
    total_results: int
    search_summary: str
    # New fields
    competition_summary: Optional[str] = None
    concept_image_url: Optional[str] = None
    concept_image_prompt: Optional[str] = None


class PatentSearchService:
    """Service for handling patent similarity searches."""

    def __init__(self):
        self.patent_retriever = patent_retriever
        self.exa_client = exa_client

    async def get_local_similar_patents(
        self, description: str, max_results: int = 5
    ) -> List[PatentResult]:
        """Search local patent corpus for similar patents."""
        if not self.patent_retriever:
            logger.warning("Patent retriever not available")
            return []

        try:
            # Search patent corpus
            corpus_results = self.patent_retriever.search_similar_chunks(
                description, top_k=max_results
            )

            local_patents = []
            for result in corpus_results:
                local_patents.append(
                    PatentResult(
                        title=result["document_name"],
                        description=result["text"][:500] + "..."
                        if len(result["text"]) > 500
                        else result["text"],
                        source=result["metadata"].get("document_path", "Local corpus"),
                        similarity_score=result["similarity"],
                        result_type="local_corpus",
                    )
                )

            return local_patents

        except Exception as e:
            logger.error(f"Error searching local patent corpus: {e}")
            return []

    async def get_web_similar_patents(
        self, description: str, title: Optional[str] = None, max_results: int = 5
    ) -> List[PatentResult]:
        """Search web for similar patents using Exa."""
        if not self.exa_client:
            logger.warning("Exa client not available - missing API key")
            return []

        try:
            # Enhanced query for patent search
            patent_query = f"patent {description}"
            if title:
                patent_query = f'patent "{title}" {description}'

            # Add patent-specific search terms
            patent_query += " invention prior art USPTO patent application filing"

            search_results = self.exa_client.search_and_contents(
                query=patent_query,
                num_results=max_results * 2,  # Get more results to filter
                text=True,
                highlights=True,
                summary=True,
                include_domains=[
                    "uspto.gov",
                    "patents.google.com",
                    "patentscope.wipo.int",
                    "espacenet.ops.epo.org",
                ],
            )

            web_patents = []
            for result in search_results.results:
                # Extract patent information
                content = ""
                if hasattr(result, "highlights") and result.highlights:
                    content = " ".join(result.highlights)
                elif hasattr(result, "summary") and result.summary:
                    content = result.summary
                elif hasattr(result, "text") and result.text:
                    content = result.text[:500]

                # Try to extract patent number from title or URL
                patent_number = self._extract_patent_number(result.title, result.url)

                web_patents.append(
                    PatentResult(
                        title=result.title,
                        description=content,
                        source=result.url,
                        similarity_score=result.score
                        if hasattr(result, "score")
                        else None,
                        patent_number=patent_number,
                        result_type="web_search",
                    )
                )

            # Limit to requested number of results
            return web_patents[:max_results]

        except Exception as e:
            logger.error(f"Error searching web for patents: {e}")
            return []

    def _extract_patent_number(self, title: str, url: str) -> Optional[str]:
        """Extract patent number from title or URL."""
        import re

        # Common patent number patterns
        patterns = [
            r"US\d{7,8}[AB]?\d?",  # US patents
            r"US\d{4}/\d{6,7}",  # US applications
            r"EP\d{7}[AB]\d",  # European patents
            r"WO\d{4}/\d{6}",  # WIPO patents
        ]

        text_to_search = f"{title} {url}"

        for pattern in patterns:
            match = re.search(pattern, text_to_search, re.IGNORECASE)
            if match:
                return match.group(0)

        return None

    async def search_similar_patents(
        self, patent_desc: PatentDescription
    ) -> PatentSearchResponse:
        """Search for similar patents using both local corpus and web search in parallel."""
        logger.info(
            f"Searching for patents similar to: {patent_desc.description[:100]}..."
        )

        # Prepare parallel searches
        async def _noop_list() -> List[PatentResult]:
            return []

        local_task = (
            self.get_local_similar_patents(
                patent_desc.description,
                max_results=patent_desc.max_local_results,
            )
            if patent_desc.use_local_corpus
            else _noop_list()
        )

        web_task = (
            self.get_web_similar_patents(
                patent_desc.description,
                patent_desc.title,
                max_results=patent_desc.max_web_results,
            )
            if patent_desc.use_web_search
            else _noop_list()
        )

        # Execute searches in parallel
        local_results, web_results = await asyncio.gather(local_task, web_task)

        # Combine and sort results
        all_results = local_results + web_results

        # Sort by similarity score (higher first), handling None values
        all_results.sort(
            key=lambda x: x.similarity_score if x.similarity_score is not None else 0.0,
            reverse=True,
        )

        # Create summary
        local_count = len(local_results)
        web_count = len(web_results)
        search_summary = f"Found {local_count} similar patents in local corpus and {web_count} from web search"

        # Post-processing: generate competition summary and concept image concurrently
        competition_summary: Optional[str] = None
        concept_image_url: Optional[str] = None
        concept_image_prompt: Optional[str] = None

        async def _gen_competition_summary() -> Optional[str]:
            try:
                return await self.generate_competition_summary(
                    query_description=patent_desc.description, results=all_results
                )
            except Exception as e:
                logger.warning(f"Competition summary unavailable: {e}")
                return None

        async def _gen_concept_image() -> Tuple[Optional[str], Optional[str]]:
            try:
                prompt = self.build_image_prompt(patent_desc, all_results)
                url = await self.generate_concept_image(prompt)
                return url, prompt
            except Exception as e:
                logger.warning(f"Concept image generation failed: {e}")
                return None, None

        try:
            summary_task = asyncio.create_task(_gen_competition_summary())
            image_task = asyncio.create_task(_gen_concept_image())
            (
                competition_summary,
                (concept_image_url, concept_image_prompt),
            ) = await asyncio.gather(summary_task, image_task)
        except Exception as e:
            logger.warning(f"Post-processing tasks failed: {e}")

        return PatentSearchResponse(
            query_description=patent_desc.description,
            similar_patents=all_results,
            local_results_count=local_count,
            web_results_count=web_count,
            total_results=len(all_results),
            search_summary=search_summary,
            competition_summary=competition_summary,
            concept_image_url=concept_image_url,
            concept_image_prompt=concept_image_prompt,
        )

    async def generate_competition_summary(
        self, query_description: str, results: List[PatentResult]
    ) -> Optional[str]:
        """Use LLM to summarize the competitive landscape from retrieved results."""
        if not anthropic_client:
            return None

        try:
            # Build compact JSON-like snapshot of top results for the LLM
            top = results[:8]
            lines: List[str] = []
            for i, r in enumerate(top, start=1):
                safe_score = (
                    f"{r.similarity_score:.3f}"
                    if r.similarity_score is not None
                    else "NA"
                )
                lines.append(
                    f"[{i}] title={r.title}; score={safe_score}; source={r.source}; type={r.result_type}; patent_no={r.patent_number or 'NA'}"
                )
            snapshot = "\n".join(lines)

            system = (
                "You are a patent analyst. Provide a concise market/competition overview in 2–4 paragraphs. "
                "Use neutral tone, no marketing language. Structure the analysis into: Key Players & Clusters, "
                "Overlaps & Differentiation (novelty gaps), Risk & Freedom-to-Operate concerns, and Next Steps for Search. "
                "Do not include bullet lists; write cohesive prose."
            )

            prompt = (
                "INVENTION DESCRIPTION:\n"
                + query_description.strip()
                + "\n\nTOP SIMILAR PATENTS (compact):\n"
                + snapshot
                + "\n\nTASK: Based on the above, summarize the competitive landscape relevant to this invention. "
                "Avoid legal conclusions; this is not legal advice."
            )

            message = anthropic_client.messages.create(
                model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
                max_tokens=800,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text if message and message.content else None
        except Exception as e:
            logger.error(f"Error generating competition summary: {e}")
            return None

    def build_image_prompt(
        self, patent_desc: PatentDescription, results: List[PatentResult]
    ) -> str:
        """Craft a detailed visual prompt for concept rendering that fits generic inventions."""
        # Derive a short subject tag from title or first words of description
        subject = (patent_desc.title or patent_desc.description[:60]).strip()
        subject = subject.replace("\n", " ")

        # Style: isometric sketch drawing on light ivory background
        style = (
            "Isometric sketch drawing, three-quarter view. Hand-drawn pencil and ink linework with clean contours, "
            "light cross-hatching, minimal shading. Light ivory paper background (#f5f5f4) with subtle paper texture. "
            "Blueprint-style construction hints allowed (light, unobtrusive). No photorealism, no 3D rendering. "
            "High-resolution scan look, clean edges, aspect 1:1."
        )

        constraints = (
            "No logos, trademarks, or readable text/labels. Avoid human faces unless essential. "
            "Emphasize mechanism, function, and form; maintain technical clarity in the sketch."
        )

        prompt = (
            f"Concept image of: {subject}. Description: {patent_desc.description.strip()} "
            f"| Style: {style} | Constraints: {constraints}"
        )
        return prompt

    async def generate_concept_image(self, prompt: str) -> Optional[str]:
        """Generate an image via FAL REST API and return the image URL."""
        fal_key = os.getenv("FAL_KEY") or os.getenv("FAL_API_KEY")
        if not fal_key:
            return None

        # Configurable model; defaults to a general-purpose image model
        model_id = os.getenv("FAL_MODEL_ID", "fal-ai/flux/schnell")
        endpoint = f"https://fal.run/{model_id}"

        # FAL API expects image_size as a dict, and num_inference_steps <= 12
        image_size_str = os.getenv("FAL_IMAGE_SIZE", "1024x1024")
        try:
            width, height = map(int, image_size_str.lower().split("x"))
            image_size = {"width": width, "height": height}
        except Exception:
            image_size = {"width": 1024, "height": 1024}

        payload: Dict[str, Any] = {
            "prompt": prompt,
            "image_size": image_size,
            "num_images": 1,
            # Some FAL models accept additional style controls; included if supported:
            "guidance_scale": 4.0,
            "num_inference_steps": 12,  # Must be <= 12 for this model
            "seed": 42,
        }

        try:
            resp = requests.post(
                endpoint,
                headers={
                    "Authorization": f"Key {fal_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=60,
            )
            if resp.status_code >= 400:
                logger.warning(f"FAL error {resp.status_code}: {resp.text[:300]}")
                return None
            data = resp.json()
            # Try common shapes
            # Case 1: { images: [{ url: ... }] }
            if (
                isinstance(data, dict)
                and "images" in data
                and isinstance(data["images"], list)
            ):
                first = data["images"][0] if data["images"] else None
                if isinstance(first, dict) and "url" in first:
                    return first["url"]
                if isinstance(first, str):
                    return first
            # Case 2: { image: { url: ... } } or { image_url: ... }
            if isinstance(data, dict):
                if (
                    "image" in data
                    and isinstance(data["image"], dict)
                    and "url" in data["image"]
                ):
                    return data["image"]["url"]
                if "image_url" in data:
                    return data["image_url"]
            return None
        except Exception as e:
            logger.error(f"FAL request failed: {e}")
            return None


# Initialize service
patent_service = PatentSearchService()

# API Endpoints


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Patent Search API is running",
        "status": "healthy",
        "patent_corpus_loaded": patent_retriever is not None,
        "web_search_available": exa_client is not None,
    }


@app.get("/patent/status")
async def get_patent_status():
    """Get patent search system status."""
    return {
        "patent_corpus_loaded": patent_retriever is not None,
        "corpus_chunks": len(patent_retriever.chunks) if patent_retriever else 0,
        "web_search_available": exa_client is not None,
        "api_keys_configured": {
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "exa": bool(os.getenv("EXA_API_KEY")),
        },
    }


@app.post("/patent/search", response_model=PatentSearchResponse)
async def search_similar_patents(patent_desc: PatentDescription):
    """
    Search for patents similar to the provided description.

    This endpoint performs parallel searches in:
    1. Local patent corpus (using vector similarity)
    2. Web search (using Exa API for patent databases)

    Returns combined results ranked by similarity.
    """
    try:
        result = await patent_service.search_similar_patents(patent_desc)
        return result
    except Exception as e:
        logger.error(f"Error in patent search: {e}")
        raise HTTPException(status_code=500, detail=f"Patent search error: {str(e)}")


@app.get("/patent/search-local")
async def search_local_patents(query: str, max_results: int = 5):
    """Search local patent corpus only."""
    if not patent_retriever:
        raise HTTPException(status_code=503, detail="Patent knowledge base not loaded")

    try:
        results = patent_retriever.search_similar_chunks(query, top_k=max_results)
        return {"query": query, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Local search error: {str(e)}")


@app.post("/patent/reload")
async def reload_patent_kb():
    """Reload the patent knowledge base."""
    global patent_retriever

    try:
        current_dir = Path(__file__).parent
        pickle_path = current_dir / "patent_knowledge_base.pkl"
        patent_retriever = PatentRAGRetriever(str(pickle_path))
        logger.info("Patent knowledge base reloaded successfully")
        return {"message": "Patent knowledge base reloaded successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reloading knowledge base: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
    # To run this API server with uvicorn, use the following command from the backend/juris directory:
    #
    #   uvicorn patent_api:app --host 0.0.0.0 --port 8001
    #
    # For development with auto-reload:
    #
    #   uvicorn patent_api:app --reload --host 0.0.0.0 --port 8001
    #
    # Or use the provided start script:
    #
    #   python start_patent_api.py
