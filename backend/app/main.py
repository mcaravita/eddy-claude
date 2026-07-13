import logging

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from app.conversations.repository import ConversationRepository, InMemoryConversationRepository
from app.responses.service import ResponseService
from app.schemas import AskRequest, AskResponse, ErrorResponse, HealthResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("eddy.api")

app = FastAPI(title="Eddy API", version="1.0.0")

_response_service = ResponseService()
_conversation_repository: ConversationRepository = InMemoryConversationRepository()


def get_response_service() -> ResponseService:
    return _response_service


def get_conversation_repository() -> ConversationRepository:
    return _conversation_repository


def _sanitize_for_log(text: str) -> str:
    """Strip newlines/carriage returns to prevent log forging (log injection)."""
    return text.replace("\n", "\\n").replace("\r", "\\r")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_error path=%s", request.url.path)
    return JSONResponse(status_code=500, content=ErrorResponse(error="internal_error").model_dump())


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/api/ask", response_model=AskResponse)
async def ask(
    payload: AskRequest,
    service: ResponseService = Depends(get_response_service),
    repository: ConversationRepository = Depends(get_conversation_repository),
) -> AskResponse:
    eddy_response = service.pick(payload.last_response_id)
    repository.add(question=payload.question, response_id=eddy_response.id)
    logger.info(
        "ask_request question=%s response_id=%s",
        _sanitize_for_log(payload.question),
        eddy_response.id,
    )
    return AskResponse(id=eddy_response.id, text=eddy_response.text)
