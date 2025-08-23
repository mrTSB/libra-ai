from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
import uvicorn

from services import chat_request
from schemas import ChatBody


app = FastAPI(title="Sage API")


@app.post("/sage/chat")
def sage_chat(body: ChatBody):
    if not body.prompt or not body.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt is required")

    if body.stream:
        stream_iter, chat_id, chat_title = chat_request(
            prompt=body.prompt,
            use_web_search=body.use_web_search,
            model_name=body.model_name or "claude-sonnet-4-20250514",
            temperature=body.temperature if body.temperature is not None else 0.0,
            stream=True,
            chat_id=body.chat_id,
        )
        return StreamingResponse(
            stream_iter,
            media_type="text/plain",
            headers={"x-chat-id": chat_id, "x-chat-title": chat_title or ""},
        )

    resp = chat_request(
        prompt=body.prompt,
        use_web_search=body.use_web_search,
        model_name=body.model_name or "claude-sonnet-4-20250514",
        temperature=body.temperature if body.temperature is not None else 0.0,
        stream=False,
        chat_id=body.chat_id,
    )
    return resp


@app.get("/sage/get_chats")
def sage_get_chats(limit: int | None = Query(default=None, ge=1, le=1000)):
    try:
        return get_chats_request(limit=limit)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

