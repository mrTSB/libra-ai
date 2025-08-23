from typing import Any, Dict, List, Optional
import logging
import dotenv
import os
from ai_sdk import openai, anthropic, generate_text, stream_text
from convex import ConvexClient

from .tools import web_search, add, get_time, rag_search

logger = logging.getLogger(__name__)
dotenv.load_dotenv()


_convex_client: Optional[ConvexClient] = None

def _get_convex_client() -> ConvexClient:
    global _convex_client
    if _convex_client is not None:
        return _convex_client
    convex_url = os.getenv("CONVEX_URL")
    if not convex_url:
        raise RuntimeError("CONVEX_URL is not set in environment")
    _convex_client = ConvexClient(convex_url)
    return _convex_client


def chat_request(
    prompt: str,
    use_web_search: bool = False,
    model_name: str = "claude-sonnet-4-20250514",
    temperature: float = 0.0,
    stream: bool = False,
    chat_id: Optional[str] = None,
    title: Optional[str] = None,
):
    """
    Run a chat request using python-ai-sdk with optional tools and Convex chat persistence.

    - Always exposes simple tools: add, get_time
    - Conditionally exposes web_search (Exa) when use_web_search is True
    - If stream is True, returns a tuple (async_generator, chat_id)
    - If stream is False, returns a dict with text/tool_calls/tool_results/chat_id/messages
    """
    # Select provider based on model name
    if model_name.startswith("claude") or model_name.startswith("anthropic"):
        model = anthropic(model_name, temperature=temperature, api_key=os.getenv("ANTHROPIC_API_KEY"))
    else:
        model = openai(model_name, temperature=temperature, api_key=os.getenv("OPENAI_API_KEY"))

    tools: List[Any] = [add, get_time, rag_search]
    if use_web_search:
        tools.append(web_search)

    logger.info(
        "chat_request: calling model with %d tools, use_web_search=%s, stream=%s",
        len(tools),
        use_web_search,
        stream,
    )

    # Ensure chat exists and fetch history
    convex_client = _get_convex_client()
    if not chat_id:
        chat_id = convex_client.mutation("chats:createChat", {"title": title or None})
    try:
        history: List[Dict[str, Any]] = convex_client.query("chats:getMessages", {"chatId": chat_id, "limit": 1000})
    except Exception:
        logger.exception("chat_request: failed to fetch history")
        history = []

    # Persist current user message immediately
    try:
        convex_client.mutation(
            "chats:addMessage",
            {"chatId": chat_id, "role": "user", "content": prompt},
        )
    except Exception:
        logger.exception("chat_request: failed to persist user message")

    # Build a lightweight conversation context
    def _format_history(msgs: List[Dict[str, Any]]) -> str:
        lines: List[str] = []
        for m in msgs[-30:]:  # take last 30
            role = m.get("role", "user")
            content = m.get("content", "")
            lines.append(f"{role.capitalize()}: {content}")
        return "\n".join(lines)

    conversation_context = _format_history(history)

    full_prompt = (
        (f"Conversation so far:\n{conversation_context}\n\n" if conversation_context else "")
        + "IMPORTANT: Wrap every citation in <cite>{JSON}</cite> with compact JSON.\n"
        + "Use these strict formats so the frontend can parse reliably.\n\n"
        + "Email citation JSON: {\"type\":\"email\",\"id\":\"<convex_id>\",\"subject\":\"<subject>\",\"date\":\"<ISO or raw>\",\"sender\":\"<email>\",\"quote\":\"<relevant excerpt>\"}\n"
        + "Web citation JSON: {\"type\":\"web\",\"title\":\"<title>\",\"url\":\"<https_url>\",\"quote\":\"<relevant excerpt>\"}\n\n"
        + "RAG (internal emails): Call rag_search, distill to 3–6 word phrase, get exactly 3 docs. "
        + "Respond with: one short paragraph summarizing the answer using the 3 docs, with inline <cite>…</cite> where appropriate; "
        + "then exactly three bullets, each ending with a <cite>{email JSON}</cite>. Do not add extra fields.\n\n"
        + "Web search: Use at most 3 sources. Provide a structured summary paragraph with inline <cite>{web JSON}</cite> and then up to three bullets, each ending with <cite>{web JSON}</cite>.\n\n"
        + "If both tools are used, keep the same <cite> JSON formats and clearly separate insights.\n\n"
        + f"User: {prompt}"
    )

    if stream:
        async def generator():
            assistant_text_parts: List[str] = []
            try:
                stream_res = stream_text(
                    model=model,
                    prompt=full_prompt,
                    tools=tools,
                )
                async for chunk in stream_res.text_stream:
                    assistant_text_parts.append(chunk)
                    yield chunk
            except Exception as exc:
                logger.exception("chat_request: error during streaming")
                yield f"[stream_error] {exc}"
            finally:
                # Persist assistant message at the end
                try:
                    final_text = "".join(assistant_text_parts)
                    convex_client.mutation(
                        "chats:addMessage",
                        {"chatId": chat_id, "role": "assistant", "content": final_text},
                    )
                except Exception:
                    logger.exception("chat_request: failed to persist assistant message (stream)")
        return generator(), chat_id

    res = generate_text(
        model=model,
        prompt=full_prompt,
        tools=tools,
    )

    logger.info(
        "chat_request: model response - text length=%d, tool_calls=%s",
        len(res.text) if res.text else 0,
        len(res.tool_calls) if res.tool_calls else 0,
    )

    # Persist assistant message
    try:
        convex_client.mutation(
            "chats:addMessage",
            {"chatId": chat_id, "role": "assistant", "content": getattr(res, "text", "") or ""},
        )
    except Exception:
        logger.exception("chat_request: failed to persist assistant message")

    # Return updated history
    try:
        messages = convex_client.query("chats:getMessages", {"chatId": chat_id, "limit": 1000})
    except Exception:
        logger.exception("chat_request: failed to refetch messages")
        messages = history

    return {
        "text": getattr(res, "text", None),
        "tool_calls": getattr(res, "tool_calls", None),
        "tool_results": getattr(res, "tool_results", None),
        "chat_id": chat_id,
        "messages": messages,
    }


