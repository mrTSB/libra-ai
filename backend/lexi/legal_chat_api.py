#!/usr/bin/env python3
"""
Legal Chat API with RAG and Exa Search Integration
Provides endpoints for legal question answering using Claude Sonnet 3.5,
local document embeddings, and Exa web search.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
from exa_py import Exa
from dotenv import load_dotenv

from legal_doc_processor import LegalRAGRetriever

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for loaded models
legal_retriever: Optional[LegalRAGRetriever] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    global legal_retriever

    # Startup
    logger.info("Loading legal knowledge base...")
    try:
        legal_retriever = LegalRAGRetriever("legal_knowledge_base.pkl")
        logger.info("Legal knowledge base loaded successfully")
    except FileNotFoundError:
        logger.warning(
            "Legal knowledge base not found. Run legal_doc_processor.py first."
        )
        legal_retriever = None
    except Exception as e:
        logger.error(f"Error loading legal knowledge base: {e}")
        legal_retriever = None

    yield

    # Shutdown
    logger.info("Shutting down legal chat API")


app = FastAPI(
    title="Legal Chat API",
    description="Legal question answering with RAG and web search",
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
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
exa_client = Exa(api_key=os.getenv("EXA_API_KEY"))


# Pydantic models
class LegalQuery(BaseModel):
    question: str
    use_web_search: bool = True
    use_local_docs: bool = True
    max_local_results: int = 5
    max_web_results: int = 3


class LegalResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    local_context_used: List[Dict[str, Any]]
    web_context_used: List[Dict[str, Any]]
    reasoning: Optional[str] = None


class ContextSource(BaseModel):
    type: str  # "local" or "web"
    title: str
    content: str
    source: str
    relevance_score: Optional[float] = None


class LegalChatService:
    """Service for handling legal chat queries with RAG and web search."""

    def __init__(self):
        self.max_context_length = 15000  # Characters for context
        self.system_prompt = """You are a highly knowledgeable legal assistant.

Write a single, cohesive paragraph that directly answers the user's question using only the provided CONTEXT. Do not include citations, lists, headings, or references; use neutral, clear prose similar to the concise summary shown at the top of a Google Search result. If the context is insufficient, note the specific missing information in the same paragraph. Keep it 3–6 sentences, accurate, and accessible to non-lawyers. Always end the paragraph with: This is informational and not legal advice."""

    async def get_local_context(
        self, query: str, max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant context from local legal documents."""
        if not legal_retriever:
            logger.warning("Legal retriever not available")
            return []

        try:
            similar_chunks = legal_retriever.search_similar_chunks(
                query, top_k=max_results
            )

            local_context = []
            for chunk in similar_chunks:
                local_context.append(
                    {
                        "type": "local",
                        "title": f"{chunk['document_name']} (Chunk {chunk['metadata']['chunk_index']})",
                        "content": chunk["text"],
                        "source": chunk["document_name"],
                        "relevance_score": chunk["similarity"],
                        "metadata": chunk["metadata"],
                    }
                )

            return local_context
        except Exception as e:
            logger.error(f"Error retrieving local context: {e}")
            return []

    async def get_web_context(
        self, query: str, max_results: int = 3
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant context from web search using Exa."""
        try:
            # Enhance query for legal search
            legal_query = f"legal {query} law statute regulation case"

            search_results = exa_client.search_and_contents(
                query=legal_query,
                num_results=max_results,
                text=True,
                highlights=True,
                summary=True,
            )

            web_context = []
            for result in search_results.results:
                # Extract highlights or use summary/text
                content = ""
                if hasattr(result, "highlights") and result.highlights:
                    content = " ".join(result.highlights)
                elif hasattr(result, "summary") and result.summary:
                    content = result.summary
                elif hasattr(result, "text") and result.text:
                    content = result.text[:1000]  # Limit length

                web_context.append(
                    {
                        "type": "web",
                        "title": result.title,
                        "content": content,
                        "source": result.url,
                        "relevance_score": result.score
                        if hasattr(result, "score")
                        else None,
                    }
                )

            return web_context
        except Exception as e:
            logger.error(f"Error retrieving web context: {e}")
            return []

    def format_context(self, local_context: List[Dict], web_context: List[Dict]) -> str:
        """Format context for Claude prompt."""
        context_parts = []

        if local_context:
            context_parts.append("=== LOCAL LEGAL DOCUMENTS ===")
            for i, ctx in enumerate(local_context, 1):
                context_parts.append(f"\n[LOCAL SOURCE {i}] {ctx['title']}")
                context_parts.append(f"Relevance: {ctx['relevance_score']:.3f}")
                context_parts.append(
                    f"Content: {ctx['content'][:2000]}..."
                )  # Limit content length
                context_parts.append("---")

        if web_context:
            context_parts.append("\n=== WEB SOURCES ===")
            for i, ctx in enumerate(web_context, 1):
                context_parts.append(f"\n[WEB SOURCE {i}] {ctx['title']}")
                context_parts.append(f"URL: {ctx['source']}")
                context_parts.append(
                    f"Content: {ctx['content'][:2000]}..."
                )  # Limit content length
                context_parts.append("---")

        full_context = "\n".join(context_parts)

        # Truncate if too long
        if len(full_context) > self.max_context_length:
            full_context = (
                full_context[: self.max_context_length] + "\n[CONTEXT TRUNCATED]"
            )

        return full_context

    async def generate_legal_response(self, query: str, context: str) -> str:
        """Generate legal response using Claude Sonnet 3.5."""
        try:
            prompt = f"""You will receive LOCAL and WEB sources.

USER QUESTION:
{query}

CONTEXT:
{context}

Write a single-paragraph summary that answers the question. No citations, no lists, no headings, no references. If context is insufficient, state what is missing within the same paragraph. End with the exact sentence: This is informational and not legal advice."""

            message = anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                system=self.system_prompt,
                messages=[{"role": "user", "content": prompt}],
            )

            return message.content[0].text
        except Exception as e:
            logger.error(f"Error generating response with Claude: {e}")
            return "I apologize, but I encountered an error while processing your legal question. Please try again or consult with a qualified legal professional."

    async def summarize_local_context(
        self, local_context: List[Dict[str, Any]]
    ) -> List[str]:
        """Summarize each local chunk into a single sentence via LLM.

        Returns a list of summaries aligned with the order of local_context.
        """
        if not local_context:
            return []

        try:
            # Build compact input to control token usage
            items = []
            for idx, ctx in enumerate(local_context, start=1):
                content = ctx.get("content", "")
                # Limit each chunk content to keep prompt size manageable
                trimmed = content[:800]
                title = ctx.get("title", f"Local Chunk {idx}")
                items.append(
                    {
                        "id": idx,
                        "title": title,
                        "text": trimmed,
                    }
                )

            instruction = (
                "You will receive a list of local legal text chunks. "
                "For each item, produce a single-sentence summary (max 30 words) capturing the key legal point(s). "
                "Return ONLY valid JSON array of objects with fields id and summary, no prose."
            )

            import json as _json

            prompt = f"{instruction}\n\nITEMS AS JSON ARRAY:\n{_json.dumps(items, ensure_ascii=False)}"

            message = anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=800,
                system=(
                    "You are a precise assistant that returns strict JSON. "
                    "Never include comments or explanations outside JSON."
                ),
                messages=[{"role": "user", "content": prompt}],
            )

            raw = message.content[0].text.strip()

            summaries: List[str] = [""] * len(local_context)
            try:
                import json as _json

                data = _json.loads(raw)
                if isinstance(data, list):
                    for obj in data:
                        try:
                            idx = int(obj.get("id")) - 1
                            if 0 <= idx < len(summaries):
                                summaries[idx] = str(obj.get("summary", "")).strip()
                        except Exception:
                            continue
            except Exception:
                # Fallback: take first sentence-ish from each content
                for i, ctx in enumerate(local_context):
                    txt = ctx.get("content", "")
                    period = txt.find(".")
                    candidate = txt[: period + 1] if period != -1 else txt[:120]
                    summaries[i] = candidate.strip()

            return summaries
        except Exception as e:
            logger.error(f"Error summarizing local context: {e}")
            return [""] * len(local_context)

    async def process_legal_query(self, query: LegalQuery) -> LegalResponse:
        """Process a legal query with RAG and web search."""
        logger.info(f"Processing legal query: {query.question[:100]}...")

        # Gather context
        local_context = []
        web_context = []

        if query.use_local_docs:
            local_context = await self.get_local_context(
                query.question, max_results=query.max_local_results
            )
            # Summarize local chunks (one-sentence) for frontend consumption
            try:
                summaries = await self.summarize_local_context(local_context)
                for i, summ in enumerate(summaries):
                    if i < len(local_context):
                        local_context[i]["summary"] = summ
            except Exception as e:
                logger.warning(f"Local summaries unavailable: {e}")

        if query.use_web_search:
            web_context = await self.get_web_context(
                query.question, max_results=query.max_web_results
            )

        # Format context for Claude
        formatted_context = self.format_context(local_context, web_context)

        # Generate response
        answer = await self.generate_legal_response(query.question, formatted_context)

        # Prepare sources
        all_sources = []
        for ctx in local_context + web_context:
            all_sources.append(
                {
                    "type": ctx["type"],
                    "title": ctx["title"],
                    "source": ctx["source"],
                    "content": ctx["content"],
                    "relevance_score": ctx.get("relevance_score"),
                    "summary": ctx.get("summary")
                    if ctx.get("type") == "local"
                    else None,
                }
            )

        return LegalResponse(
            answer=answer,
            sources=all_sources,
            local_context_used=local_context,
            web_context_used=web_context,
            reasoning=f"Used {len(local_context)} local sources and {len(web_context)} web sources",
        )


# Initialize service
legal_service = LegalChatService()


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Legal Chat API is running",
        "status": "healthy",
        "legal_kb_loaded": legal_retriever is not None,
    }


@app.post("/legal/chat", response_model=LegalResponse)
async def legal_chat(query: LegalQuery):
    """Main legal chat endpoint."""
    try:
        if not query.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        response = await legal_service.process_legal_query(query)
        return response

    except Exception as e:
        logger.error(f"Error in legal chat: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/legal/status")
async def legal_status():
    """Get system status."""
    return {
        "legal_retriever_loaded": legal_retriever is not None,
        "total_chunks": len(legal_retriever.chunks) if legal_retriever else 0,
        "documents": [
            doc["document_name"] for doc in legal_retriever.knowledge_base["documents"]
        ]
        if legal_retriever
        else [],
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "exa_configured": bool(os.getenv("EXA_API_KEY")),
    }


@app.post("/legal/reload")
async def reload_legal_kb():
    """Reload the legal knowledge base."""
    global legal_retriever
    try:
        legal_retriever = LegalRAGRetriever("legal_knowledge_base.pkl")
        return {"message": "Legal knowledge base reloaded successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reloading knowledge base: {str(e)}"
        )


@app.get("/legal/search")
async def search_legal_docs(query: str, max_results: int = 5):
    """Search local legal documents only."""
    if not legal_retriever:
        raise HTTPException(status_code=503, detail="Legal knowledge base not loaded")

    try:
        results = legal_retriever.search_similar_chunks(query, top_k=max_results)
        return {"query": query, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
