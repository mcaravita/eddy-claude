from fastapi.testclient import TestClient

from app.main import app
from app.responses.service import ResponseService

client = TestClient(app)
known_ids = ResponseService().all_ids()


def test_ask_valid_question_returns_known_response() -> None:
    response = client.post("/api/ask", json={"question": "Che tempo fa?"})

    assert response.status_code == 200
    body = response.json()
    assert body["id"] in known_ids
    assert isinstance(body["text"], str) and body["text"]


def test_ask_no_repeat_excludes_last_response_id() -> None:
    first = client.post("/api/ask", json={"question": "Domanda uno"}).json()

    for _ in range(30):
        second = client.post(
            "/api/ask",
            json={"question": "Domanda due", "last_response_id": first["id"]},
        ).json()
        assert second["id"] != first["id"]


def test_ask_empty_question_returns_422() -> None:
    response = client.post("/api/ask", json={"question": ""})

    assert response.status_code == 422


def test_ask_too_long_question_returns_422() -> None:
    response = client.post("/api/ask", json={"question": "a" * 501})

    assert response.status_code == 422


def test_ask_missing_question_returns_422() -> None:
    response = client.post("/api/ask", json={})

    assert response.status_code == 422
