from pydantic import BaseModel


class WorkflowBody(BaseModel):
    message: str
    title: str
    send_email: bool = False
