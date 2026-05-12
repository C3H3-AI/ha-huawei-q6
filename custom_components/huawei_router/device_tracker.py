"""Support for Huawei routers as device tracker."""



from __future__ import annotations



from typing import Any



from homeassistant.components.device_tracker.config_entry import ScannerEntity

from homeassistant.components.device_tracker.const import SourceType

from homeassistant.config_entries import ConfigEntry

from homeassistant.core import HomeAssistant, callback

from homeassistant.helpers.entity_platform import AddEntitiesCallback

from homeassistant.helpers.update_coordinator import CoordinatorEntity



from .classes import ConnectedDevice
from .client.classes import MAC_ADDR
from .const import DOMAIN
from .helpers import get_coordinator

from .options import HuaweiIntegrationOptions

from .update_coordinator import HuaweiDataUpdateCoordinator



FILTER_ATTRS = ["connected_via_id", "vendor_class_id", "zone"]





# ---------------------------

#   async_setup_entry

# ---------------------------

async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up device tracker for Huawei component."""
    coordinator = get_coordinator(hass, config_entry)
    integration_options = HuaweiIntegrationOptions(config_entry)
    tracked: dict[MAC_ADDR, HuaweiTracker] = {}

    # 初始清理：移除离线设备的 device_tracker 实体
    if integration_options.skip_offline_devices:
        from homeassistant.helpers import entity_registry as er_mod
        er = er_mod.async_get(hass)
        for mac, device in coordinator.connected_devices.items():
            if device.is_router or device.is_active:
                continue
            for entity_entry in list(er.entities.values()):
                if entity_entry.platform == DOMAIN and mac.lower().replace(':', '_') in entity_entry.unique_id.lower():
                    er.async_remove(entity_entry.entity_id)

    # 为活跃的非路由器设备显式创建设备注册表条目
    from homeassistant.helpers import device_registry as dr_mod
    dr = dr_mod.async_get(hass)
    for mac, device in coordinator.connected_devices.items():
        if not device.is_active or device.is_router:
            continue
        device_info = coordinator.get_device_info(mac)
        if device_info:
            dr.async_get_or_create(
                config_entry_id=config_entry.entry_id,
                **device_info,
            )

    @callback
    def coordinator_updated():
        """Update the status of the device."""
        # 移除已离线的设备追踪器
        if integration_options.skip_offline_devices:
            from homeassistant.helpers import entity_registry as er_mod
            er = er_mod.async_get(hass)
            to_remove = [
                mac for mac, tracker in tracked.items()
                if not tracker.device.is_active
            ]
            for mac in to_remove:
                tracker = tracked.pop(mac, None)
                if tracker and tracker.entity_id:
                    er.async_remove(tracker.entity_id)
        update_items(coordinator, integration_options, async_add_entities, tracked)



    config_entry.async_on_unload(coordinator.async_add_listener(coordinator_updated))

    coordinator_updated()





# ---------------------------

#   update_items

# ---------------------------

@callback

def update_items(

    coordinator: HuaweiDataUpdateCoordinator,

    integration_options: HuaweiIntegrationOptions,

    async_add_entities: AddEntitiesCallback,

    tracked: dict[MAC_ADDR, HuaweiTracker],

) -> None:

    """Update tracked device state from the hub."""

    new_tracked: list[HuaweiTracker] = []
    for mac, device in coordinator.connected_devices.items():
        if integration_options.skip_offline_devices and not device.is_active:
            continue
        if mac not in tracked:
            tracked[mac] = HuaweiTracker(device, integration_options, coordinator)
            new_tracked.append(tracked[mac])



    if new_tracked:

        async_add_entities(new_tracked)





# ---------------------------

#   HuaweiTracker

# ---------------------------

class HuaweiTracker(CoordinatorEntity, ScannerEntity):

    """Representation of network device."""



    def __init__(

        self,

        device: ConnectedDevice,

        integration_options: HuaweiIntegrationOptions,

        coordinator: HuaweiDataUpdateCoordinator,

    ) -> None:

        """Initialize the tracked device."""

        self.device: ConnectedDevice = device

        self._use_zones = integration_options.device_tracker_zones



        if integration_options.devices_tags:

            self._filter_attrs = FILTER_ATTRS

        else:

            self._filter_attrs = list(FILTER_ATTRS)

            self._filter_attrs.append("tags")



        super().__init__(coordinator)



    @property

    def state(self) -> str:

        if self._use_zones and self.is_connected:

            return (

                self.device.zone.name

                if self.device and self.device.zone

                else super().state

            )

        return super().state



    @property

    def is_connected(self) -> bool:

        """Return true if the client is connected to the network."""

        return self.device.is_active



    @property

    def source_type(self) -> str:

        """Return the source type of the client."""

        return SourceType.GPS if self._use_zones else SourceType.ROUTER



    @property

    def name(self) -> str:

        """Return the name of the client."""

        return self.device.name



    @property

    def hostname(self) -> str:

        """Return the hostname of the client."""

        return self.device.host_name



    @property

    def mac_address(self) -> MAC_ADDR:

        """Return the mac address of the client."""

        return self.device.mac



    @property

    def ip_address(self) -> str:

        """Return the ip address of the client."""

        return self.device.ip_address



    @property

    def unique_id(self) -> str:

        """Return an unique identifier for this device."""

        return f"{self.coordinator.unique_id}_{self.device.mac}"



    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the device state attributes."""
        return {k: v for k, v in self.device.all_attrs if k not in self._filter_attrs}

    @property
    def entity_registry_enabled_default(self) -> bool:
        return True

    @property
    def device_info(self):
        """Return device information."""
        from homeassistant.helpers.device_registry import DeviceInfo

        identifiers = set()
        if self.device.mac:
            identifiers.add((DOMAIN, self.device.mac))
        if self.device.is_router and self.device.host_name:
            identifiers.add((DOMAIN, self.device.host_name))

        connections = None
        if self.device.mac:
            connections = {("mac", str(self.device.mac).lower())}

        dev_brands = self.device._data.get("dev_brands")
        manufacturer = dev_brands if dev_brands else None

        result = DeviceInfo(
            identifiers=identifiers,
            manufacturer=manufacturer,
            name=self.device.name,
            sw_version=None,
            hw_version=None,
            connections=connections,
            configuration_url=f"http://{self.device.ip_address}" if self.device.ip_address else None,
        )

        return result

