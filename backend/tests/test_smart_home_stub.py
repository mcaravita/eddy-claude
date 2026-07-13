import pytest

from app.smart_home.adapter import StubSmartHomeAdapter


def test_get_devices_returns_non_empty_list() -> None:
    adapter = StubSmartHomeAdapter()

    devices = adapter.get_devices()

    assert len(devices) > 0


def test_toggle_device_flips_state() -> None:
    adapter = StubSmartHomeAdapter()
    device = adapter.get_devices()[0]

    toggled = adapter.toggle_device(device.id)

    assert toggled.id == device.id
    assert toggled.is_on != device.is_on


def test_toggle_device_unknown_id_raises_key_error() -> None:
    adapter = StubSmartHomeAdapter()

    with pytest.raises(KeyError):
        adapter.toggle_device("unknown")


def test_get_temperature_returns_float() -> None:
    adapter = StubSmartHomeAdapter()

    assert isinstance(adapter.get_temperature(), float)
