from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol


@dataclass(frozen=True)
class ConversationEntry:
    question: str
    response_id: str
    timestamp: datetime


class ConversationRepository(Protocol):
    def add(self, question: str, response_id: str) -> None: ...
    def recent(self, limit: int) -> list[ConversationEntry]: ...


class InMemoryConversationRepository:
    """Default repository (Phase 1): entries live only in process memory."""

    def __init__(self) -> None:
        self._entries: list[ConversationEntry] = []

    def add(self, question: str, response_id: str) -> None:
        entry = ConversationEntry(
            question=question,
            response_id=response_id,
            timestamp=datetime.now(UTC),
        )
        self._entries.append(entry)

    def recent(self, limit: int) -> list[ConversationEntry]:
        if limit <= 0:
            return []
        return list(reversed(self._entries[-limit:]))
