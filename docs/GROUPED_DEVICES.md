# 华为路由器设备分组显示 - 混合模式实现

## 当前问题

```
现状：
├── 主路由设备列表 (扁平结构)
│   ├── 华为P60
│   ├── 华为P40
│   └── ... (所有设备混在一起)

问题：无法看出设备连接到了哪个子路由器
```

## 解决方案：混合模式

```
混合模式：
├── 主路由总览
│   └── 所有设备列表 (当前方式)
│       ├── 华为P60 → 属性显示: 连接路由器=客厅
│       └── ...
└── 子路由分组
    ├── 客厅 (5G)
    │   ├── 华为P60
    │   ├── 华为P40
    │   └── ...
    ├── 东边套
    │   ├── 设备A
    │   └── ...
    └── ...
```

---

## 实现方案

### 修改内容

需要新增一个 **分组设备列表传感器** (`grouped_devices` sensor)

### 方案A：创建新的sensor文件

创建 `grouped_devices_sensor.py`：

```python
"""分组设备列表传感器 - 按子路由器显示设备"""

from dataclasses import dataclass
from typing import Callable, Final

from homeassistant.components.sensor import (
    SensorEntity,
    SensorEntityDescription,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .helpers import (
    generate_entity_id,
    generate_entity_name,
    generate_entity_unique_id,
    get_coordinator,
)
from .options import HuaweiIntegrationOptions
from .update_coordinator import HuaweiDataUpdateCoordinator

_ENTITY_DOMAIN: Final = "sensor"
_FUNCTION_DISPLAYED_NAME: Final = "grouped devices"
_FUNCTION_UID: Final = "sensor_grouped_devices"


@dataclass
class HuaweiGroupedDevicesEntityDescription(SensorEntityDescription):
    device_mac: str | None = None
    device_name: str | None = None


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up grouped devices sensors for Huawei component."""
    coordinator = get_coordinator(hass, config_entry)
    integration_options = HuaweiIntegrationOptions(config_entry)

    sensors = []

    # 1. 主路由总览传感器 - 显示所有设备
    sensors.append(
        HuaweiGroupedDevicesSensor(
            coordinator,
            HuaweiGroupedDevicesEntityDescription(
                key="all_devices",
                icon="mdi:account-multiple",
                name=generate_entity_name(_FUNCTION_DISPLAYED_NAME, "所有设备"),
                device_mac=None,
                device_name="所有设备",
                function_uid=_FUNCTION_UID,
            ),
        )
    )

    # 2. 为每个子路由创建分组传感器
    if integration_options.router_clients_sensors:
        for mac, device in coordinator.connected_devices.items():
            # 判断是否是子路由器
            if device.connected_via_id and device.connected_via_id != "Primary router":
                sensors.append(
                    HuaweiGroupedDevicesSensor(
                        coordinator,
                        HuaweiGroupedDevicesEntityDescription(
                            key=mac,
                            icon="mdi:router-wireless",
                            name=generate_entity_name(_FUNCTION_DISPLAYED_NAME, device.name),
                            device_mac=mac,
                            device_name=device.name,
                            function_uid=_FUNCTION_UID,
                        ),
                    )
                )

    async_add_entities(sensors)


class HuaweiGroupedDevicesSensor(
    CoordinatorEntity[HuaweiDataUpdateCoordinator],
    SensorEntity
):
    """分组设备列表传感器"""

    entity_description: HuaweiGroupedDevicesEntityDescription
    _attr_native_value: int = 0

    def __init__(
        self,
        coordinator: HuaweiDataUpdateCoordinator,
        description: HuaweiGroupedDevicesEntityDescription,
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_device_info = coordinator.get_device_info(description.device_mac)
        self._attr_unique_id = generate_entity_unique_id(
            coordinator, description.key, description.device_mac
        )
        self.entity_id = generate_entity_id(
            coordinator,
            _ENTITY_DOMAIN,
            _FUNCTION_DISPLAYED_NAME,
            description.device_name,
        )

    @property
    def available(self) -> bool:
        return self.coordinator.is_router_online(self.entity_description.device_mac)

    @property
    def native_value(self) -> int:
        """返回设备数量"""
        return self._device_count

    @property
    def extra_state_attributes(self) -> dict:
        """返回设备列表"""
        return {
            "devices": self._device_list,
            "device_count": self._device_count,
            "connection_type": self._connection_type,
        }

    @callback
    def _handle_coordinator_update(self) -> None:
        self._update_devices()
        super()._handle_coordinator_update()

    def _update_devices(self) -> None:
        """更新设备列表"""
        devices = []
        target_mac = self.entity_description.device_mac

        for mac, device in self.coordinator.connected_devices.items():
            if target_mac is None:
                # 所有设备模式 - 只显示活跃设备
                if device.is_active:
                    devices.append({
                        "name": device.name,
                        "ip": device.ip_address,
                        "mac": device.mac,
                        "connected_to": device.connected_via_id,
                    })
            else:
                # 子路由模式 - 显示连接到该子路由的设备
                if device.connected_via_id == target_mac:
                    devices.append({
                        "name": device.name,
                        "ip": device.ip_address,
                        "mac": device.mac,
                    })

        # 按名称排序
        devices.sort(key=lambda x: x["name"])
        
        self._device_list = devices
        self._device_count = len(devices)
        self._connection_type = "all" if target_mac is None else "sub_router"
```

---

## Lovelace卡片配置

### 主路由总览卡片

```yaml
type: entities
title: 📱 所有在线设备
entities:
  - entity: sensor.huawei_router_grouped_devices_all_devices
    icon: mdi:account-multiple
```

点击该实体可以看到属性中的设备列表和IP地址。

### 子路由分组卡片

```yaml
type: vertical-stack
title: 📶 Mesh子路由设备分布
cards:
  - type: horizontal-stack
    cards:
      - type: entity
        entity: sensor.huawei_router_grouped_devices_ke_ting
        icon: mdi:router-wireless
        name: 客厅
      - type: entity
        entity: sensor.huawei_router_grouped_devices_dong_bian_tao
        icon: mdi:router-wireless
        name: 东边套
      - type: entity
        entity: sensor.huawei_router_grouped_devices_bei_bian_tao
        icon: mdi:router-wireless
        name: 北边套
      - type: entity
        entity: sensor.huawei_router_grouped_devices_er_lou
        icon: mdi:router-wireless
        name: 二楼
      - type: entity
        entity: sensor.huawei_router_grouped_devices_xi_bian_tao
        icon: mdi:router-wireless
        name: 西边套
```

### 详细设备列表卡片

```yaml
type: markdown
title: 📋 设备详细列表
content: >
  {% for state in states.sensor %}
    {% if 'grouped_devices' in state.entity_id and state.entity_id.endswith('_all_devices') %}
      {% set devices = state.attributes.devices %}
      
      ## 所有在线设备 ({{ devices|length }}台)
      
      | 设备名称 | IP地址 | 连接的子路由 |
      |---------|--------|-------------|
      {% for device in devices %}
      | {{ device.name }} | {{ device.ip }} | {{ device.connected_to }} |
      {% endfor %}
    {% endif %}
  {% endfor %}
```

---

## 部署步骤

1. 创建新文件 `grouped_devices_sensor.py`
2. 修改 `__init__.py` 注册新平台
3. 重启HA

---

## 效果预览

### 实体列表
```
sensor.huawei_router_grouped_devices_all_devices    # 所有设备总览 (数量)
sensor.huawei_router_grouped_devices_ke_ting         # 客厅子路由设备
sensor.huawei_router_grouped_devices_dong_bian_tao  # 东边套子路由设备
sensor.huawei_router_grouped_devices_bei_bian_tao  # 北边套子路由设备
sensor.huawei_router_grouped_devices_er_lou         # 二楼子路由设备
sensor.huawei_router_grouped_devices_xi_bian_tao   # 西边套子路由设备
```

### 实体属性
```yaml
sensor.huawei_router_grouped_devices_ke_ting:
  state: 29                    # 29台设备
  attributes:
    devices:
      - name: 华为P60
        ip: 192.168.3.233
        mac: B2:3D:0A:78:C8:E2
      - name: 华为P40
        ip: 192.168.3.41
        mac: A2:5C:E8:0D:E7:D7
      - ...
    device_count: 29
    connection_type: sub_router
```

---

**你想让我现在实现这个功能吗？**
