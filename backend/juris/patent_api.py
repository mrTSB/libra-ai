#!/usr/bin/env python3
"""
Patent Search API with RAG and Exa Search Integration
Provides endpoints for patent similarity search using local corpus and web search.
"""

import os
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import anthropic
from exa_py import Exa
from dotenv import load_dotenv

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
        logger.warning("Patent knowledge base not found. Run setup_patent_system.py first.")
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
    lifespan=lifespan
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

# Pydantic models
class PatentDescription(BaseModel):
    """Patent description for similarity search."""
    description: str = Field(..., description="Description of the patent to search for similar patents")
    title: Optional[str] = Field(None, description="Optional title of the patent")
    inventor: Optional[str] = Field(None, description="Optional inventor name")
    use_web_search: bool = Field(True, description="Whether to include web search for similar patents")
    use_local_corpus: bool = Field(True, description="Whether to search local patent corpus")
    max_local_results: int = Field(5, description="Maximum number of local corpus results")
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

class PatentSearchService:
    """Service for handling patent similarity searches."""
    
    def __init__(self):
        self.patent_retriever = patent_retriever
        self.exa_client = exa_client
    
    async def get_local_similar_patents(self, description: str, max_results: int = 5) -> List[PatentResult]:
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
                local_patents.append(PatentResult(
                    title=result['document_name'],
                    description=result['text'][:500] + "..." if len(result['text']) > 500 else result['text'],
                    source=result['metadata'].get('document_path', 'Local corpus'),
                    similarity_score=result['similarity'],
                    result_type='local_corpus'
                ))
            
            return local_patents
            
        except Exception as e:
            logger.error(f"Error searching local patent corpus: {e}")
            return []
    
    async def get_web_similar_patents(self, description: str, title: Optional[str] = None, 
                                    max_results: int = 5) -> List[PatentResult]:
        """Search web for similar patents using Exa."""
        if not self.exa_client:
            logger.warning("Exa client not available - missing API key")
            return []
        
        try:
            # Enhanced query for patent search
            patent_query = f"patent {description}"
            if title:
                patent_query = f"patent \"{title}\" {description}"
            
            # Add patent-specific search terms
            patent_query += " invention prior art USPTO patent application filing"
            
            search_results = self.exa_client.search_and_contents(
                query=patent_query,
                num_results=max_results * 2,  # Get more results to filter
                text=True,
                highlights=True,
                summary=True,
                include_domains=["uspto.gov", "patents.google.com", "patentscope.wipo.int", "espacenet.ops.epo.org"]
            )
            
            web_patents = []
            for result in search_results.results:
                # Extract patent information
                content = ""
                if hasattr(result, 'highlights') and result.highlights:
                    content = " ".join(result.highlights)
                elif hasattr(result, 'summary') and result.summary:
                    content = result.summary
                elif hasattr(result, 'text') and result.text:
                    content = result.text[:500]
                
                # Try to extract patent number from title or URL
                patent_number = self._extract_patent_number(result.title, result.url)
                
                web_patents.append(PatentResult(
                    title=result.title,
                    description=content,
                    source=result.url,
                    similarity_score=result.score if hasattr(result, 'score') else None,
                    patent_number=patent_number,
                    result_type='web_search'
                ))
            
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
            r'US\d{7,8}[AB]?\d?',  # US patents
            r'US\d{4}/\d{6,7}',    # US applications
            r'EP\d{7}[AB]\d',      # European patents
            r'WO\d{4}/\d{6}',      # WIPO patents
        ]
        
        text_to_search = f"{title} {url}"
        
        for pattern in patterns:
            match = re.search(pattern, text_to_search, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return None
    
    async def search_similar_patents(self, patent_desc: PatentDescription) -> PatentSearchResponse:
        """Search for similar patents using both local corpus and web search in parallel."""
        logger.info(f"Searching for patents similar to: {patent_desc.description[:100]}...")
        
        # Prepare parallel searches
        tasks = []
        
        if patent_desc.use_local_corpus:
            tasks.append(
                self.get_local_similar_patents(
                    patent_desc.description,
                    max_results=patent_desc.max_local_results
                )
            )
        else:
            tasks.append(asyncio.create_task(asyncio.sleep(0, result=[])))
        
        if patent_desc.use_web_search:
            tasks.append(
                self.get_web_similar_patents(
                    patent_desc.description,
                    patent_desc.title,
                    max_results=patent_desc.max_web_results
                )
            )
        else:
            tasks.append(asyncio.create_task(asyncio.sleep(0, result=[])))
        
        # Execute searches in parallel
        local_results, web_results = await asyncio.gather(*tasks)
        
        # Combine and sort results
        all_results = local_results + web_results
        
        # Sort by similarity score (higher first), handling None values
        all_results.sort(
            key=lambda x: x.similarity_score if x.similarity_score is not None else 0.0,
            reverse=True
        )
        
        # Create summary
        local_count = len(local_results)
        web_count = len(web_results)
        search_summary = f"Found {local_count} similar patents in local corpus and {web_count} from web search"
        
        return PatentSearchResponse(
            query_description=patent_desc.description,
            similar_patents=all_results,
            local_results_count=local_count,
            web_results_count=web_count,
            total_results=len(all_results),
            search_summary=search_summary
        )

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
        "web_search_available": exa_client is not None
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
            "exa": bool(os.getenv("EXA_API_KEY"))
        }
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
        raise HTTPException(status_code=500, detail=f"Error reloading knowledge base: {str(e)}")

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
