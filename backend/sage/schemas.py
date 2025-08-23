from pydantic import BaseModel


class ChatBody(BaseModel):
    prompt: str
    use_web_search: bool = False
    model_name: str | None = None
    temperature: float | None = None
    stream: bool = False
    chat_id: str | None = None
    title: str | None = None


