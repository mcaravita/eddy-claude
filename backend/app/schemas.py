from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    last_response_id: str | None = None


class AskResponse(BaseModel):
    id: str
    text: str


class HealthResponse(BaseModel):
    status: str


class ErrorResponse(BaseModel):
    error: str
