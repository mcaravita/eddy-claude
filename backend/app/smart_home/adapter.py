from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Device:
    id: str
    name: str
    is_on: bool


class SmartHomeAdapter(Protocol):
    def get_devices(self) -> list[Device]: ...
    def toggle_device(self, device_id: str) -> Device: ...
    def get_temperature(self) -> float: ...


class StubSmartHomeAdapter:
    """Deterministic fake adapter. Seam for a future real integration (AGENTS.md §13).

    Not routed via the API in Phase 1 — see AGENTS.md §8bis.
    """

    def __init__(self) -> None:
        self._devices: dict[str, Device] = {
            "dev_light_living": Device(id="dev_light_living", name="Luce soggiorno", is_on=True),
            "dev_light_kitchen": Device(id="dev_light_kitchen", name="Luce cucina", is_on=False),
            "dev_thermostat": Device(id="dev_thermostat", name="Termostato", is_on=True),
        }

    def get_devices(self) -> list[Device]:
        return list(self._devices.values())

    def toggle_device(self, device_id: str) -> Device:
        if device_id not in self._devices:
            raise KeyError(f"Unknown device id: {device_id}")
        current = self._devices[device_id]
        updated = Device(id=current.id, name=current.name, is_on=not current.is_on)
        self._devices[device_id] = updated
        return updated

    def get_temperature(self) -> float:
        return 21.5
