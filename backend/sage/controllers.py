from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse

from .services import chat_request
from .schemas import ChatBody


app = FastAPI(title="Sage API")

@app.post("/sage/chat")
def sage_chat(body: ChatBody):
    if not body.prompt or not body.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt is required")

    if body.stream:
        stream_iter, chat_id = chat_request(
            prompt=body.prompt,
            use_web_search=body.use_web_search,
            model_name=body.model_name or "claude-sonnet-4-20250514",
            temperature=body.temperature if body.temperature is not None else 0.0,
            stream=True,
            chat_id=body.chat_id,
            title=body.title or "",
        )
        return StreamingResponse(stream_iter, media_type="text/plain", headers={"x-chat-id": chat_id})

    resp = chat_request(
        prompt=body.prompt,
        use_web_search=body.use_web_search,
        model_name=body.model_name or "claude-sonnet-4-20250514",
        temperature=body.temperature if body.temperature is not None else 0.0,
        stream=False,
        chat_id=body.chat_id,
        title=body.title,
    )
    return resp
