from app.conversations.repository import InMemoryConversationRepository


def test_add_and_recent_returns_entries_in_reverse_chronological_order() -> None:
    repo = InMemoryConversationRepository()
    repo.add(question="Prima domanda", response_id="r_001")
    repo.add(question="Seconda domanda", response_id="r_002")
    repo.add(question="Terza domanda", response_id="r_003")

    entries = repo.recent(limit=2)

    assert [e.response_id for e in entries] == ["r_003", "r_002"]


def test_recent_respects_limit_smaller_than_history() -> None:
    repo = InMemoryConversationRepository()
    for i in range(5):
        repo.add(question=f"Domanda {i}", response_id=f"r_{i}")

    assert len(repo.recent(limit=3)) == 3


def test_recent_with_zero_limit_returns_empty_list() -> None:
    repo = InMemoryConversationRepository()
    repo.add(question="Domanda", response_id="r_001")

    assert repo.recent(limit=0) == []


def test_recent_on_empty_repository_returns_empty_list() -> None:
    repo = InMemoryConversationRepository()

    assert repo.recent(limit=10) == []
