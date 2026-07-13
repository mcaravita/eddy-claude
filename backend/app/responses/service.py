import json
import random
from dataclasses import dataclass
from pathlib import Path

DEFAULT_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "responses.json"


class ResponseDataError(Exception):
    """Raised when the responses data file is missing, malformed, or empty."""


@dataclass(frozen=True)
class EddyResponse:
    id: str
    text: str


class ResponseService:
    """Serves random canned responses with immediate no-repeat per client."""

    def __init__(self, data_path: Path | str = DEFAULT_DATA_PATH) -> None:
        self._responses = self._load(Path(data_path))

    def pick(self, last_response_id: str | None = None) -> EddyResponse:
        pool = self._responses
        if last_response_id is not None and len(pool) >= 2:
            filtered = [r for r in pool if r.id != last_response_id]
            if filtered:
                pool = filtered
        return random.choice(pool)

    def all_ids(self) -> set[str]:
        return {r.id for r in self._responses}

    @staticmethod
    def _load(path: Path) -> list[EddyResponse]:
        if not path.is_file():
            raise ResponseDataError(f"Responses file not found: {path}")
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ResponseDataError(f"Responses file is not valid JSON: {path}") from exc

        entries = raw.get("responses") if isinstance(raw, dict) else None
        if not isinstance(entries, list) or not entries:
            raise ResponseDataError("Responses file must contain a non-empty 'responses' list")

        responses: list[EddyResponse] = []
        seen_ids: set[str] = set()
        for entry in entries:
            if not isinstance(entry, dict):
                raise ResponseDataError(f"Invalid response entry: {entry!r}")
            entry_id = entry.get("id")
            text = entry.get("text")
            if not isinstance(entry_id, str) or not entry_id:
                raise ResponseDataError(f"Response entry missing valid 'id': {entry!r}")
            if not isinstance(text, str) or not text:
                raise ResponseDataError(f"Response entry missing valid 'text': {entry!r}")
            if entry_id in seen_ids:
                raise ResponseDataError(f"Duplicate response id: {entry_id}")
            seen_ids.add(entry_id)
            responses.append(EddyResponse(id=entry_id, text=text))

        return responses
