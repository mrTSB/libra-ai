from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse

from .services import run_workflow_sse
from .schemas import WorkflowBody

app = FastAPI(title="Donna API")

@app.post("/donna/workflow")
def donna_workflow(body: WorkflowBody):
    try:
        generator = run_workflow_sse(message=body.message, title=body.title, send_email=body.send_email)
        return StreamingResponse(generator, media_type="text/event-stream")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))