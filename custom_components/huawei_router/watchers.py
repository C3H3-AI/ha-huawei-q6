"""Watcher classes for tracking changes in Huawei Router data."""

from __future__ import annotations

from typing import TYPE_CHECKING, Callable, Iterable

from homeassistant.helpers.entity_registry import EntityRegistry

from .classes import ConnectedDevice, HuaweiInterfaceType, PortMapping, UrlFilter
from .client.classes import MAC_ADDR, HuaweiTimeControlItem
from .utils import HuaweiChangesWatcher, _TItem, _TKey

if TYPE_CHECKING:
    from .update_coordinator import HuaweiDataUpdateCoordinator


# ---------------------------
#   HuaweiUrlFiltersWatcher
# ---------------------------
class HuaweiUrlFiltersWatcher(HuaweiChangesWatcher[str, UrlFilter]):

    def _get_actual_items(self) -> Iterable[_TItem]:
        return self._coordinator.url_filters.values()

    def _get_key(self, item: _TItem) -> _TKey:
        return item.filter_id

    def __init__(self, coordinator: HuaweiDataUpdateCoordinator) -> None:
        """Initialize."""
        self._coordinator = coordinator
        super().__init__(lambda item: True)

    def look_for_changes(
        self,
        on_added: Callable[[str, UrlFilter], None] | None = None,
        on_removed: Callable[[EntityRegistry, str, UrlFilter], None] | None = None,
    ) -> None:
        """Look for difference between previously known and current lists of items."""
        added, removed = self._get_difference(self._coordinator.hass)
        if on_added:
            for key, item in added:
                on_added(key, item)
        if on_removed:
            for er, key, item in removed:
                on_removed(er, key, item)


# ---------------------------
#   HuaweiTimeControlItemsWatcher
# ---------------------------
class HuaweiTimeControlItemsWatcher(HuaweiChangesWatcher[str, HuaweiTimeControlItem]):

    def _get_actual_items(self) -> Iterable[_TItem]:
        return self._coordinator.time_control_items.values()

    def _get_key(self, item: _TItem) -> _TKey:
        return item.id

    def __init__(self, coordinator: HuaweiDataUpdateCoordinator) -> None:
        """Initialize."""
        self._coordinator = coordinator
        super().__init__(lambda item: True)

    def look_for_changes(
        self,
        on_added: Callable[[str, HuaweiTimeControlItem], None] | None = None,
        on_removed: Callable[[EntityRegistry, str, HuaweiTimeControlItem], None] | None = None,
    ) -> None:
        """Look for difference between previously known and current lists of items."""
        added, removed = self._get_difference(self._coordinator.hass)
        if on_added:
            for key, item in added:
                on_added(key, item)
        if on_removed:
            for er, key, item in removed:
                on_removed(er, key, item)


# ---------------------------
#   HuaweiPortMappingsWatcher
# ---------------------------
class HuaweiPortMappingsWatcher(HuaweiChangesWatcher[str, PortMapping]):

    def _get_actual_items(self) -> Iterable[_TItem]:
        return self._coordinator.port_mappings.values()

    def _get_key(self, item: _TItem) -> _TKey:
        return item.id

    def __init__(self, coordinator: HuaweiDataUpdateCoordinator) -> None:
        """Initialize."""
        self._coordinator = coordinator
        super().__init__(lambda item: True)

    def look_for_changes(
        self,
        on_added: Callable[[str, PortMapping], None] | None = None,
        on_removed: Callable[[EntityRegistry, str, PortMapping], None] | None = None,
    ) -> None:
        """Look for difference between previously known and current lists of items."""
        added, removed = self._get_difference(self._coordinator.hass)
        if on_added:
            for key, item in added:
                on_added(key, item)
        if on_removed:
            for er, key, item in removed:
                on_removed(er, key, item)


# ---------------------------
#   HuaweiConnectedDevicesWatcher
# ---------------------------
class HuaweiConnectedDevicesWatcher(HuaweiChangesWatcher[MAC_ADDR, ConnectedDevice]):

    def _get_actual_items(self) -> Iterable[_TItem]:
        return self._coordinator.connected_devices.values()

    def _get_key(self, item: _TItem) -> _TKey:
        return item.mac

    def __init__(
        self,
        coordinator: HuaweiDataUpdateCoordinator,
        devices_predicate: Callable[[ConnectedDevice], bool],
    ) -> None:
        """Initialize."""
        self._coordinator = coordinator
        super().__init__(devices_predicate)

    def look_for_changes(
        self,
        on_added: Callable[[MAC_ADDR, ConnectedDevice], None] | None = None,
        on_removed: Callable[[EntityRegistry, MAC_ADDR, ConnectedDevice], None] | None = None,
    ) -> None:
        """Look for difference between previously known and current lists of items."""
        added, removed = self._get_difference(self._coordinator.hass)
        if on_added:
            for key, item in added:
                on_added(key, item)
        if on_removed:
            for er, key, item in removed:
                on_removed(er, key, item)


# ---------------------------
#   ActiveRoutersWatcher
# ---------------------------
class ActiveRoutersWatcher(HuaweiConnectedDevicesWatcher):

    @staticmethod
    def filter(device: ConnectedDevice) -> bool:
        return device.is_active and device.is_router

    def __init__(self, coordinator: HuaweiDataUpdateCoordinator) -> None:
        """Initialize."""
        super().__init__(coordinator, ActiveRoutersWatcher.filter)


# ---------------------------
#   ClientWirelessDevicesWatcher
# ---------------------------
class ClientWirelessDevicesWatcher(HuaweiConnectedDevicesWatcher):

    @staticmethod
    def filter(device: ConnectedDevice) -> bool:
        if device.is_router:
            return False
        return device.interface_type in [
            HuaweiInterfaceType.INTERFACE_2_4GHZ,
            HuaweiInterfaceType.INTERFACE_5GHZ,
        ]

    def __init__(self, coordinator: HuaweiDataUpdateCoordinator) -> None:
        """Initialize."""
        super().__init__(coordinator, ClientWirelessDevicesWatcher.filter)