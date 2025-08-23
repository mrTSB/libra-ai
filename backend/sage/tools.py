import os
import datetime
import logging
from typing import Dict, Any, List, Optional, Tuple

from exa_py import Exa
from ai_sdk import tool
from dotenv import load_dotenv
from convex import ConvexClient
from openai import OpenAI


load_dotenv()


logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=os.getenv("SAGE_LOG_LEVEL", "INFO"))


_convex_client: Optional[ConvexClient] = None
_openai_client: Optional[OpenAI] = None


def _get_convex_client() -> ConvexClient:
    global _convex_client
    if _convex_client is not None:
        return _convex_client

    convex_url = os.getenv("CONVEX_URL")
    if not convex_url:
        raise RuntimeError("CONVEX_URL is not set in environment")
    _convex_client = ConvexClient(convex_url)
    return _convex_client


def _get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is not None:
        return _openai_client

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set in environment")
    _openai_client = OpenAI(api_key=openai_api_key)
    return _openai_client

def _get_exa_client() -> Exa:
    api_key = os.getenv("EXA_API_KEY")
    if not api_key:
        raise RuntimeError("EXA_API_KEY is not set in environment")
    return Exa(api_key=api_key)


def _web_search_execute(q: str, top_k: int = 3, include_snippets: bool = True) -> Dict[str, Any]:
    logger.info("web_search: start q='%s' top_k=%s include_snippets=%s", q, top_k, include_snippets)
    try:
        client = _get_exa_client()

        resp = client.search_and_contents(
            query=q,
            num_results=top_k,
            text=True,
            highlights=include_snippets,
            summary=True,
        )

        results = []
        for r in resp.results:
            snippet = None
            if include_snippets and getattr(r, "highlights", None):
                snippet = " ".join(r.highlights)[:500]
            elif getattr(r, "summary", None):
                snippet = r.summary[:500]
            elif getattr(r, "text", None):
                snippet = r.text[:500]

            results.append(
                {
                    "title": getattr(r, "title", ""),
                    "url": getattr(r, "url", ""),
                    "snippet": snippet,
                }
            )

        logger.info("web_search: returned %d results", len(results))
        return {"query": q, "results": results}
    except Exception as e:
        logger.exception("web_search: error")
        return {"query": q, "results": [], "error": str(e)}


web_search = tool(
    name="web_search",
    description="Search the web using Exa and return a list of results with optional snippets.",
    parameters={
        "type": "object",
        "properties": {
            "q": {"type": "string", "description": "Search query"},
            "top_k": {
                "type": "integer",
                "minimum": 1,
                "maximum": 3,
                "default": 3,
                "description": "Number of results to return (limited to 3)",
            },
            "include_snippets": {
                "type": "boolean",
                "default": True,
                "description": "Include text snippets in results",
            },
        },
        "required": ["q"],
    },
    execute=lambda q, top_k=3, include_snippets=True: _web_search_execute(
        q, top_k, include_snippets
    ),
)


add = tool(
    name="add",
    description="Add two numbers and return the sum.",
    parameters={
        "type": "object",
        "properties": {
            "a": {"type": "integer"},
            "b": {"type": "integer"},
        },
        "required": ["a", "b"],
    },
    execute=lambda a, b: a + b,
)


get_time = tool(
    name="get_time",
    description="Return the current UTC time in ISO 8601 format.",
    parameters={
        "type": "object",
        "properties": {},
        "required": [],
    },
    execute=lambda: datetime.datetime.utcnow().isoformat() + "Z",
)


def _rag_search_execute(q: str, top_k: int = 5, keywords: Optional[List[str]] = None) -> Dict[str, Any]:
    logger.info("rag_search: start q='%s' top_k=%s keywords=%s", q, top_k, keywords)
    # Pure semantic: do not inject derived keywords by default; only use provided keywords
    try:
        openai_client = _get_openai_client()
        emb_resp = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=q,
        )
        embedding: List[float] = emb_resp.data[0].embedding
        logger.info("rag_search: embedding length=%d first5=%s", len(embedding), embedding[:5])
    except Exception as e:
        logger.exception("rag_search: embedding error")
        return {"query": q, "results": [], "error": f"embedding_error: {e}"}

    # Query Convex with embedding (server function handles vector search)
    try:
        convex_client = _get_convex_client()
        # Log convex URL for diagnostics (skip doc count due to server errors)
        convex_url = os.getenv("CONVEX_URL")
        logger.info("rag_search: using CONVEX_URL=%s", convex_url)
        candidate_count = int(os.getenv("SAGE_RAG_CANDIDATES", "60"))
        # Enforce exactly 3 results from Convex action
        fixed_top_k = 3
        raw_results = convex_client.action(
            "documents:searchDocuments",
            {
                "embedding": embedding,
                "limit": fixed_top_k,
            },
        )
        logger.info(
            "rag_search: convex action searchDocuments returned %d docs (fixed_top_k=%s)",
            len(raw_results) if isinstance(raw_results, list) else -1,
            fixed_top_k,
        )
        # If zero results, proactively fallback to recent documents to verify connectivity/data
        if isinstance(raw_results, list) and len(raw_results) == 0:
            logger.info("rag_search: empty vector results; falling back to getRecentDocuments")
            try:
                raw_results = convex_client.query(
                    "documents:getRecentDocuments", {"limit": max(1, min(top_k, 10))}
                )
                logger.info("rag_search: fallback getRecentDocuments returned %d docs", len(raw_results) if isinstance(raw_results, list) else -1)
            except Exception:
                logger.exception("rag_search: fallback getRecentDocuments failed")
    except Exception as e:
        logger.exception("rag_search: convex searchDocuments error, attempting fallback getRecentDocuments")
        try:
            convex_client = _get_convex_client()
            raw_results = convex_client.query(
                "documents:getRecentDocuments", {"limit": max(1, min(top_k, 10))}
            )
            logger.info("rag_search: fallback getRecentDocuments returned %d docs", len(raw_results) if isinstance(raw_results, list) else -1)
        except Exception as e2:
            logger.exception("rag_search: convex fallback error")
            return {"query": q, "results": [], "error": f"convex_error: {e2}"}

    # Pure semantic rerank: retain vector score; if explicit keywords provided, lightly boost
    def kw_overlap_score(doc: Dict[str, Any]) -> float:
        text = ((doc.get("content") or "") + " " + (doc.get("metadata", {}).get("subject") or "")).lower()
        if not text:
            return 0.0
        score = 0.0
        if keywords:
            kws = [k.lower() for k in keywords if isinstance(k, str)]
            for k in kws:
                if k in text:
                    score += 1.0
        return score

    before_rank_count = len(raw_results) if isinstance(raw_results, list) else 0
    if isinstance(raw_results, list) and before_rank_count > 0:
        # Normalize vector score if present
        vec_scores = [d.get("score") for d in raw_results if isinstance(d, dict) and isinstance(d.get("score"), (int, float))]
        min_s = min(vec_scores) if vec_scores else 0.0
        max_s = max(vec_scores) if vec_scores else 1.0
        def norm_s(x: Optional[float]) -> float:
            if x is None:
                return 0.0
            if max_s - min_s < 1e-6:
                return 0.0
            return (x - min_s) / (max_s - min_s)

        reranked = []
        for d in raw_results:
            vs = norm_s(d.get("score"))
            ks = kw_overlap_score(d)
            # normalize keyword score by count
            ks_norm = ks / max(1.0, float(len(keywords or [])) * 1.0)
            combined = 0.95 * vs + 0.05 * ks_norm
            dd = dict(d)
            dd["_combinedScore"] = combined
            dd["_kwScore"] = ks
            dd["_vecScoreNorm"] = vs
            reranked.append(dd)

        reranked.sort(key=lambda x: x.get("_combinedScore", 0.0), reverse=True)
        raw_results = reranked
        logger.info("rag_search: reranked docs=%d top_combined=%.3f", len(reranked), reranked[0]["_combinedScore"] if reranked else -1)

    # Truncate and shape results
    shaped = []
    if isinstance(raw_results, list):
        # Log a compact preview of the top results
        try:
            preview = [
                {
                    "id": str(doc.get("_id")),
                    "subject": (doc.get("metadata", {}) or {}).get("subject"),
                    "date": (doc.get("metadata", {}) or {}).get("date"),
                    "score": doc.get("score"),
                    "combined": doc.get("_combinedScore"),
                }
                for doc in raw_results[: 3]
            ]
            logger.info("rag_search: preview=%s", preview)
        except Exception:
            logger.exception("rag_search: failed to log preview")
        for doc in raw_results[: 3]:
            shaped.append(
                {
                    "id": str(doc.get("_id", "")),
                    "content": doc.get("content", ""),
                    "metadata": doc.get("metadata", {}),
                    "createdAt": doc.get("createdAt"),
                    "score": doc.get("score"),
                    "_combinedScore": doc.get("_combinedScore"),
                }
            )
    logger.info("rag_search: shaped %d docs", len(shaped))

    return {"query": q, "results": shaped}


rag_search = tool(
    name="rag_search",
    description=(
        "Retrieve top documents from the Convex documents table using semantic similarity (RAG). "
        "Embed ONLY the concise topic phrase provided in 'q' (do not embed full questions). "
        "Optionally filter/boost with keywords. Returns up to top_k results."
    ),
    parameters={
        "type": "object",
        "properties": {
            "q": {"type": "string", "description": "Concise topic phrase to embed (<= 6 words)"},
            "top_k": {
                "type": "integer",
                "minimum": 1,
                "maximum": 3,
                "default": 3,
                "description": "Number of documents to return (fixed to 3)",
            },
            "keywords": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Optional keyword filters; all must be present in content",
            },
        },
        "required": ["q"],
    },
    execute=lambda q, top_k=5, keywords=None: _rag_search_execute(q, top_k, keywords),
)

