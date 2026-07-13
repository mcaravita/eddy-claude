import pytest

from app.responses.service import ResponseDataError, ResponseService


def test_pick_returns_one_of_the_loaded_responses() -> None:
    service = ResponseService()

    result = service.pick()

    assert result.id in service.all_ids()


def test_pick_excludes_last_response_id_when_pool_has_multiple_entries() -> None:
    service = ResponseService()
    last_id = service.pick().id

    for _ in range(30):
        assert service.pick(last_response_id=last_id).id != last_id


def test_pick_with_single_response_still_returns_it(tmp_path) -> None:
    data_file = tmp_path / "responses.json"
    data_file.write_text(
        '{"version": 1, "responses": [{"id": "r_001", "text": "Unica risposta possibile."}]}',
        encoding="utf-8",
    )
    service = ResponseService(data_path=data_file)

    result = service.pick(last_response_id="r_001")

    assert result.id == "r_001"


def test_missing_file_raises_response_data_error(tmp_path) -> None:
    missing = tmp_path / "missing.json"

    with pytest.raises(ResponseDataError):
        ResponseService(data_path=missing)


def test_empty_responses_list_raises_response_data_error(tmp_path) -> None:
    data_file = tmp_path / "responses.json"
    data_file.write_text('{"version": 1, "responses": []}', encoding="utf-8")

    with pytest.raises(ResponseDataError):
        ResponseService(data_path=data_file)


def test_duplicate_ids_raise_response_data_error(tmp_path) -> None:
    data_file = tmp_path / "responses.json"
    data_file.write_text(
        '{"version": 1, "responses": ['
        '{"id": "r_001", "text": "Prima."}, {"id": "r_001", "text": "Seconda."}'
        "]}",
        encoding="utf-8",
    )

    with pytest.raises(ResponseDataError):
        ResponseService(data_path=data_file)


def test_malformed_json_raises_response_data_error(tmp_path) -> None:
    data_file = tmp_path / "responses.json"
    data_file.write_text("{not valid json", encoding="utf-8")

    with pytest.raises(ResponseDataError):
        ResponseService(data_path=data_file)
