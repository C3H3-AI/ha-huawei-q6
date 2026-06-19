"""Router and WAN sensor entities for Huawei Router."""

from __future__ import annotations

import logging

from homeassistant.core import callback

from .sensor import HuaweiSensor, HuaweiWanSensorEntityDescription

_LOGGER = logging.getLogger(__name__)


# ---------------------------
#   HuaweiWanStatusSensor
# ---------------------------
class HuaweiWanStatusSensor(HuaweiSensor):
    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str = "unknown"

    @property
    def available(self) -> bool:
        """Return if entity is available."""
        return self.coordinator.is_router_online(None)

    @callback
    def _handle_coordinator_update(self) -> None:
        wan_info = self.coordinator.get_wan_info()
        if wan_info:
            self._attr_native_value = "已连接" if wan_info.connected else "已断开"
        else:
            self._attr_native_value = "未知"
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiRouterInfoSensor
# ---------------------------
class HuaweiRouterInfoSensor(HuaweiSensor):
    """路由器信息传感器 - 显示路由器型号、序列号等信息"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_entity_category = "diagnostic"

    def __init__(
        self,
        coordinator,
        description: HuaweiWanSensorEntityDescription,
        info_type: str,
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, description)
        self._info_type = info_type

    @property
    def available(self) -> bool:
        """Return if entity is available."""
        return self.coordinator.is_router_online(self.entity_description.device_mac)

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        router_info = self.coordinator.get_router_info(device_mac)
        if router_info:
            if self._info_type == "model":
                self._attr_native_value = router_info.model
            elif self._info_type == "serial_number":
                self._attr_native_value = router_info.serial_number
            elif self._info_type == "software_version":
                self._attr_native_value = router_info.software_version
            elif self._info_type == "hardware_version":
                self._attr_native_value = router_info.hardware_version
            elif self._info_type == "harmony_version":
                self._attr_native_value = router_info.harmony_os_version
            elif self._info_type == "mac_address":
                self._attr_native_value = router_info.mac_address if router_info else None
                if self._attr_native_value is None and router_info:
                    self._attr_native_value = router_info.mac_address
                if self._attr_native_value is None:
                    for mac, cd in self.coordinator._connected_devices.items():
                        if cd.ip_address == self.coordinator.cfg_host:
                            self._attr_native_value = str(mac)
                            break
                if self._attr_native_value is None and device_mac is None:
                    for mac, cd in self.coordinator._connected_devices.items():
                        if cd.is_router:
                            self._attr_native_value = str(mac)
                            break
                if self._attr_native_value is None and device_mac is None:
                    for mac, cd in self.coordinator._connected_devices.items():
                        if cd.name and ("router" in cd.name.lower() or "网关" in cd.name or "Gateway" in cd.name):
                            self._attr_native_value = str(mac)
                            break
                if self._attr_native_value is None and device_mac is None:
                    self._attr_native_value = self.coordinator.get_primary_router_mac()
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiWanIpSensor
# ---------------------------
class HuaweiWanIpSensor(HuaweiSensor):
    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None

    @property
    def available(self) -> bool:
        """Return if entity is available."""
        return self.coordinator.is_router_online(None)

    @callback
    def _handle_coordinator_update(self) -> None:
        wan_info = self.coordinator.get_wan_info()
        if wan_info:
            self._attr_native_value = wan_info.address
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiWanIpv6Sensor
# ---------------------------
class HuaweiWanIpv6Sensor(HuaweiSensor):
    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_extra_state_attributes: dict = {}

    @property
    def available(self) -> bool:
        """Return if entity is available."""
        return self.coordinator.is_router_online(None)

    @callback
    def _handle_coordinator_update(self) -> None:
        wan_info = self.coordinator.get_wan_info()
        if wan_info:
            ipv6 = wan_info.ipv6_address
            if ipv6 and "/" in ipv6:
                parts = ipv6.split("/")
                self._attr_extra_state_attributes["prefix_length"] = parts[1]
                ipv6 = parts[0]
            else:
                self._attr_extra_state_attributes.pop("prefix_length", None)
            self._attr_native_value = ipv6
        else:
            self._attr_native_value = None
            self._attr_extra_state_attributes.pop("prefix_length", None)
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiWanSpeedSensor
# ---------------------------
class HuaweiWanSpeedSensor(HuaweiSensor):
    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: float = 0.0

    @property
    def available(self) -> bool:
        """Return if entity is available."""
        return self.coordinator.is_router_online(None)

    @callback
    def _handle_coordinator_update(self) -> None:
        wan_info = self.coordinator.get_wan_info()
        if wan_info:
            if "download" in self.entity_description.key:
                self._attr_native_value = float(wan_info.download_rate)
            else:
                self._attr_native_value = float(wan_info.upload_rate)
        else:
            self._attr_native_value = 0.0
        super()._handle_coordinator_update()