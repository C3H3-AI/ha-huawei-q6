"""Device-specific sensors for Huawei Router."""

from __future__ import annotations

import logging

from homeassistant.components.sensor import SensorStateClass
from homeassistant.const import EntityCategory
from homeassistant.core import callback

from .client.classes import MAC_ADDR
from .sensor import HuaweiSensor, HuaweiWanSensorEntityDescription

_LOGGER = logging.getLogger(__name__)


# ---------------------------
#   HuaweiDeviceIpSensor
# ---------------------------
class HuaweiDeviceIpSensor(HuaweiSensor):
    """显示连接设备的IP地址"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active
        return self.coordinator.is_router_online(None)

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            if device:
                self._attr_native_value = device.ip_address
            else:
                self._attr_native_value = None
        else:
            self._attr_native_value = self.coordinator.config_entry.data.get("host")
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceMacSensor
# ---------------------------
class HuaweiDeviceMacSensor(HuaweiSensor):
    """显示连接设备的MAC地址"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active
        return self.coordinator.is_router_online(None)

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            self._attr_native_value = str(device_mac)
        else:
            self._attr_native_value = None
            for mac, cd in self.coordinator._connected_devices.items():
                if cd.ip_address == self.coordinator.cfg_host:
                    self._attr_native_value = str(mac)
                    break
            if self._attr_native_value is None:
                for mac, cd in self.coordinator._connected_devices.items():
                    if cd.is_router:
                        self._attr_native_value = str(mac)
                        break
            if self._attr_native_value is None:
                for mac, cd in self.coordinator._connected_devices.items():
                    if cd.name and ("router" in cd.name.lower() or "网关" in cd.name or "Gateway" in cd.name):
                        self._attr_native_value = str(mac)
                        break
            if self._attr_native_value is None:
                self._attr_native_value = self.coordinator.get_primary_router_mac()
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceConnectionTypeSensor
# ---------------------------
class HuaweiDeviceConnectionTypeSensor(HuaweiSensor):
    """显示设备的连接方式(WiFi/有线等)"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            if device:
                self._attr_native_value = device.interface_type
            else:
                self._attr_native_value = None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceSignalSensor
# ---------------------------
class HuaweiDeviceSignalSensor(HuaweiSensor):
    """信号强度传感器 - 显示设备的WiFi信号强度"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: int | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_native_unit_of_measurement = "dBm"

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active and device._data.get("rssi") is not None
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            if device:
                self._attr_native_value = device._data.get("rssi")
            else:
                self._attr_native_value = None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceUploadSpeedSensor
# ---------------------------
class HuaweiDeviceUploadSpeedSensor(HuaweiSensor):
    """上传速度传感器"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: float | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_native_unit_of_measurement = "kB/s"
    _attr_state_class = SensorStateClass.MEASUREMENT

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            if device:
                self._attr_native_value = device._data.get("upload_rate_kilobytes_s")
            else:
                self._attr_native_value = None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceDownloadSpeedSensor
# ---------------------------
class HuaweiDeviceDownloadSpeedSensor(HuaweiSensor):
    """下载速度传感器"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: float | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_native_unit_of_measurement = "kB/s"
    _attr_state_class = SensorStateClass.MEASUREMENT

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            if device:
                self._attr_native_value = device._data.get("download_rate_kilobytes_s")
            else:
                self._attr_native_value = None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceConnectionRateSensor
# ---------------------------
class HuaweiDeviceConnectionRateSensor(HuaweiSensor):
    """连接速率传感器"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: float | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_native_unit_of_measurement = "Mbps"
    _attr_state_class = SensorStateClass.MEASUREMENT

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active and device.connected_rate is not None
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            self._attr_native_value = device.connected_rate if device else None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceFrequencySensor
# ---------------------------
class HuaweiDeviceFrequencySensor(HuaweiSensor):
    """频段传感器 (2.4GHz/5GHz)"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active and device.frequency is not None
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            freq = device.frequency if device else None
            if freq:
                self._attr_native_value = f"{freq} GHz"
            else:
                self._attr_native_value = None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceBrandsSensor
# ---------------------------
class HuaweiDeviceBrandsSensor(HuaweiSensor):
    """厂商传感器"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active and device.vendor is not None
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            self._attr_native_value = device.vendor if device else None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceTypeSensor
# ---------------------------
class HuaweiDeviceTypeSensor(HuaweiSensor):
    """设备类型传感器"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            self._attr_native_value = device.device_type if device else None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceTxDataSensor
# ---------------------------
class HuaweiDeviceTxDataSensor(HuaweiSensor):
    """上行数据总量传感器"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: float | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_native_unit_of_measurement = "MB"

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active and device.total_tx is not None
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            self._attr_native_value = round(device.total_tx / (1024 * 1024), 2) if device and device.total_tx else None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceRxDataSensor
# ---------------------------
class HuaweiDeviceRxDataSensor(HuaweiSensor):
    """下行数据总量传感器"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: float | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_native_unit_of_measurement = "MB"

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active and device.total_rx is not None
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            self._attr_native_value = round(device.total_rx / (1024 * 1024), 2) if device and device.total_rx else None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceParentControlSensor
# ---------------------------
class HuaweiDeviceParentControlSensor(HuaweiSensor):
    """家长控制状态传感器"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: bool | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active and device.parental_control is not None
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            self._attr_native_value = device.parental_control if device else None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()


# ---------------------------
#   HuaweiDeviceConnectedViaSensor
# ---------------------------
class HuaweiDeviceConnectedViaSensor(HuaweiSensor):
    """连接方式传感器 - 显示设备是直连还是通过子路由"""

    entity_description: HuaweiWanSensorEntityDescription
    _attr_native_value: str | None = None
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def available(self) -> bool:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            return device is not None and device.is_active
        return False

    @callback
    def _handle_coordinator_update(self) -> None:
        device_mac = self.entity_description.device_mac
        if device_mac:
            device = self.coordinator.connected_devices.get(device_mac)
            if device:
                router_mac = device.router_mac
                if router_mac and router_mac != device_mac:
                    router_device = self.coordinator.connected_devices.get(router_mac)
                    self._attr_native_value = router_device.name if router_device else router_mac
                else:
                    self._attr_native_value = "主路由"
            else:
                self._attr_native_value = None
        else:
            self._attr_native_value = None
        super()._handle_coordinator_update()