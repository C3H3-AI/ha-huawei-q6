"""Huawei Controller for Huawei Router."""



from __future__ import annotations



from datetime import timedelta

from functools import wraps

import logging

from typing import Any, Callable, Final, Iterable



from homeassistant.components.zone.const import DOMAIN as ZONE_DOMAIN

from homeassistant.config_entries import ConfigEntry

from homeassistant.const import (

    CONF_HOST,

    CONF_NAME,

    CONF_PASSWORD,

    CONF_PORT,

    CONF_SSL,

    CONF_USERNAME,

    CONF_VERIFY_SSL,

)

from homeassistant.core import HomeAssistant, callback, CALLBACK_TYPE

from homeassistant.helpers import entity_registry

from homeassistant.helpers import device_registry as dr

from homeassistant.helpers.entity import DeviceInfo

from homeassistant.helpers.entity_registry import EntityRegistry

from homeassistant.helpers.storage import Store

from homeassistant.helpers.update_coordinator import DataUpdateCoordinator



from .classes import (

    ConnectedDevice,

    EmulatedSwitch,

    HuaweiEvents,

    HuaweiInterfaceType,

    HuaweiWlanFilterMode,

    PortMapping,

    Select,

    UrlFilter,

    ZoneInfo,

)

from .client.classes import (

    MAC_ADDR,

    NODE_HILINK_TYPE_DEVICE,

    Action,

    Feature,

    FilterAction,

    FilterMode,

    HuaweiClientDevice,

    HuaweiConnectionInfo,

    HuaweiDeviceNode,

    HuaweiFilterInfo,

    HuaweiRouterInfo,

    HuaweiTimeControlItem,

    HuaweiUrlFilterInfo,

    Switch,

)

from .client.const import CONNECTED_VIA_ID_PRIMARY

from .client.huaweiapi import HuaweiApi

from .const import ATTR_MANUFACTURER, DOMAIN

from .options import HuaweiIntegrationOptions

from .utils import (

    HuaweiChangesWatcher,

    TagsMap,

    ZonesMap,

    _TItem,

    _TKey,

    get_readable_rate,

)



_PRIMARY_ROUTER_IDENTITY: Final = "primary_router"





class CoordinatorError(Exception):

    def __init__(self, message: str) -> None:

        """Initialize."""

        super().__init__(message)

        self._message = message



    def __str__(self, *args, **kwargs) -> str:

        """Return str(self)."""

        return self._message





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

        on_removed: (

            Callable[[EntityRegistry, str, HuaweiTimeControlItem], None] | None

        ) = None,

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

        on_removed: (

            Callable[[EntityRegistry, MAC_ADDR, ConnectedDevice], None] | None

        ) = None,

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





# ---------------------------

#   suppress_exceptions_when_unloaded

# ---------------------------

def suppress_exceptions_when_unloaded(func):

    @wraps(func)

    async def wrapper(*args, **kwargs):

        coordinator = args[0]

        try:

            return await func(*args, **kwargs)

        except Exception as ex:

            if not coordinator.is_unloaded:

                raise

            else:

                coordinator._logger.debug(

                    "Exception suppressed, coordinator is unloaded: %s", repr(ex)

                )



    return wrapper





# ---------------------------

#   suppress_update_exception

# ---------------------------

def suppress_update_exception(error_template: str):

    def decorator(func):

        @wraps(func)

        async def wrapper(*args, **kwargs):

            coordinator = args[0]

            try:

                return await func(*args, **kwargs)

            except Exception as ex:

                if coordinator.is_unloaded:

                    coordinator._logger.debug(error_template, repr(ex))

                else:

                    coordinator._logger.warning(error_template, repr(ex))



        return wrapper



    return decorator





# ---------------------------

#   HuaweiDataUpdateCoordinator

# ---------------------------

class HuaweiDataUpdateCoordinator(DataUpdateCoordinator):

    def __init__(

        self,

        hass: HomeAssistant,

        config_entry: ConfigEntry,

        integration_options: HuaweiIntegrationOptions,

        tags_map_storage: Store | None,

        zones_map_storage: Store | None,

    ) -> None:

        """Initialize HuaweiController."""

        self._is_initial_update: bool = True
        self._associated_devices: set[str] = set()

        self._logger = logging.getLogger(f"{__name__} ({config_entry.data[CONF_NAME]})")

        self._is_unloaded: bool = False

        self._is_repeater: bool = False

        self._integration_options: HuaweiIntegrationOptions = integration_options



        self._events: HuaweiEvents = HuaweiEvents(hass)



        self._tags_map: TagsMap | None = (

            TagsMap(tags_map_storage, self._logger)

            if self._integration_options.devices_tags and tags_map_storage

            else None

        )



        self._zones_map: ZonesMap | None = (

            ZonesMap(zones_map_storage, self._logger)

            if self._integration_options.device_tracker_zones and zones_map_storage

            else None

        )



        self._connected_devices: dict[MAC_ADDR, ConnectedDevice] = {}
        self._wan_info: HuaweiConnectionInfo | None = None
        self._zones: list[ZoneInfo] = []



        self._config: ConfigEntry = config_entry

        self._routersWatcher: ActiveRoutersWatcher = ActiveRoutersWatcher(self)



        self._apis: dict[MAC_ADDR, HuaweiApi] = {

            _PRIMARY_ROUTER_IDENTITY: HuaweiApi(

                host=config_entry.data[CONF_HOST],

                port=config_entry.data[CONF_PORT],

                use_ssl=config_entry.data[CONF_SSL],

                user=config_entry.data[CONF_USERNAME],

                password=config_entry.data[CONF_PASSWORD],

                verify_ssl=config_entry.data[CONF_VERIFY_SSL],

            )

        }

        self._router_infos: dict[MAC_ADDR, HuaweiRouterInfo] = {}

        self._primary_router_mac: MAC_ADDR | None = None

        self._switch_states: dict[Switch | EmulatedSwitch | str, bool] = {}

        self._select_states: dict[Select | str, str] = {}

        self._wlan_filter_info: HuaweiFilterInfo | None = None

        self._url_filters: dict[str, UrlFilter] = {}

        self._time_control_items: dict[str, HuaweiTimeControlItem] = {}

        self._port_mappings: dict[str, PortMapping] = {}



        super().__init__(

            hass,

            self._logger,

            name=config_entry.data[CONF_NAME],

            update_method=self.async_update,

            update_interval=timedelta(

                seconds=self._integration_options.update_interval

            ),

        )



    @property

    def primary_router_name(self) -> str:

        return self.name



    @property

    def is_unloaded(self) -> bool:

        return self._is_unloaded



    @property

    def unique_id(self) -> str:

        """Return the system descriptor."""

        entry = self.config_entry



        if entry.unique_id:

            return entry.unique_id



        return entry.entry_id



    @property
    def cfg_host(self) -> str:
        """Return the host of the router."""
        return self.config_entry.data[CONF_HOST]

    def get_primary_router_mac(self) -> MAC_ADDR | None:
        """Get primary router MAC address from ARP table."""
        if self._primary_router_mac is not None:
            return self._primary_router_mac

        try:
            import subprocess
            result = subprocess.run(
                ['arp', '-n', self.cfg_host],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.split('\n'):
                if self.cfg_host in line and 'ether' in line:
                    parts = line.split()
                    if len(parts) >= 3:
                        mac = parts[2].upper()
                        if ':' in mac or '-' in mac:
                            self._primary_router_mac = mac
                            self._logger.debug(
                                "Primary router MAC from ARP: %s", self._primary_router_mac
                            )
                            return self._primary_router_mac
        except Exception as ex:
            self._logger.debug("Failed to get primary router MAC: %s", ex)

        return None



    @property

    def connected_devices(self) -> dict[MAC_ADDR, ConnectedDevice]:

        """Return the connected devices."""

        return self._connected_devices



    @property

    def url_filters(self) -> dict[str, UrlFilter]:

        """Return the url filters."""

        return self._url_filters



    @property

    def time_control_items(self) -> dict[str, HuaweiTimeControlItem]:

        """Return the time control items."""

        return self._time_control_items



    @property

    def port_mappings(self) -> dict[str, PortMapping]:

        """Return the port mappings."""

        return self._port_mappings



    @property

    def tags_map(self) -> TagsMap:

        """Return the tags map."""

        if self._integration_options.devices_tags:

            return self._tags_map

        else:

            raise CoordinatorError("Devices tags are disabled by integration options.")



    @property

    def zones_map(self) -> ZonesMap:

        """Return the zones map."""

        if self._integration_options.device_tracker_zones:

            return self._zones_map

        else:

            raise CoordinatorError(

                "Devices tracker zones are disabled by integration options."

            )



    @property

    def zones(self) -> Iterable[ZoneInfo]:

        return self._zones



    @property

    def primary_router_api(self) -> HuaweiApi:

        return self._select_api(None)



    @property

    def primary_router_serial_number(self) -> str | None:

        info = self.get_router_info()

        return info.serial_number if info else None



    def is_router_online(self, device_mac: MAC_ADDR | None = None) -> bool:
        """Check if router is online.
        
        For primary router: checks if API is initialized.
        For satellite routers: checks if API is available, or falls back to primary router.
        """
        key = device_mac or _PRIMARY_ROUTER_IDENTITY
        
        # 主路由直接检查API是否存在
        if key == _PRIMARY_ROUTER_IDENTITY:
            return self._apis.get(key) is not None
        
        # 子路由：先检查是否有自己的API
        if key in self._apis:
            return True
        
        # 子路由没有独立API时，回退到主路由检查
        # 这样可以让子路由的button/select实体在主路由在线时显示可用
        return self._apis.get(_PRIMARY_ROUTER_IDENTITY) is not None

    @property
    def diagnostics_info(self) -> dict:
        """Return diagnostic information about the integration."""
        primary_online = self._apis.get(_PRIMARY_ROUTER_IDENTITY) is not None
        satellite_count = len([k for k in self._apis.keys() if k != _PRIMARY_ROUTER_IDENTITY])
        connected_devices_count = len(self._connected_devices)
        active_devices = sum(1 for d in self._connected_devices.values() if d.is_active)

        wifi_2_4 = sum(1 for d in self._connected_devices.values()
                       if d.interface_type == HuaweiInterfaceType.INTERFACE_2_4GHZ)
        wifi_5 = sum(1 for d in self._connected_devices.values()
                    if d.interface_type == HuaweiInterfaceType.INTERFACE_5GHZ)
        lan = sum(1 for d in self._connected_devices.values()
                 if d.interface_type == HuaweiInterfaceType.INTERFACE_LAN)

        wan_info = self._wan_info

        return {
            "primary_router_online": primary_online,
            "primary_router_name": self.primary_router_name,
            "satellite_routers_count": satellite_count,
            "satellite_routers": [k for k in self._apis.keys() if k != _PRIMARY_ROUTER_IDENTITY],
            "total_connected_devices": connected_devices_count,
            "active_devices": active_devices,
            "wifi_2_4_ghz_devices": wifi_2_4,
            "wifi_5_ghz_devices": wifi_5,
            "lan_devices": lan,
            "port_mappings_count": len(self._port_mappings),
            "url_filters_count": len(self._url_filters),
            "time_control_items_count": len(self._time_control_items),
            "zones_count": len(self.zones),
            "wan_connected": wan_info.connected if wan_info else False,
            "wan_external_ip": wan_info.address if wan_info else None,
            "wan_uptime": wan_info.uptime if wan_info else 0,
            "wan_upload_speed_kbps": wan_info.upload_rate if wan_info else 0,
            "wan_download_speed_kbps": wan_info.download_rate if wan_info else 0,
        }

    def get_router_info(

        self, device_mac: MAC_ADDR | None = None

    ) -> HuaweiRouterInfo | None:

        """Return the information of the router."""

        return self._router_infos.get(device_mac or _PRIMARY_ROUTER_IDENTITY)



    def get_wan_info(self) -> HuaweiConnectionInfo | None:
        """Return the information of the router."""
        return self._wan_info


    def get_device_uptime(self, device_mac: MAC_ADDR) -> int | None:
        """Return uptime for a specific device (e.g., satellite router)."""
        device = self._connected_devices.get(device_mac)
        if device:
            return device.uptime
        return None

    def get_upnp_entity_state(self, entity_name: str) -> str | None:
        """Get state from UPnP entity by entity name suffix."""
        from homeassistant.core import HomeAssistant
        hass: HomeAssistant = self.hass
        state = hass.states.get(entity_name)
        return state.state if state else None

    def get_configuration_url(self, device_mac: MAC_ADDR | None = None) -> str:

        """Return the router's configuration URL."""

        return self._select_api(device_mac).router_url



    def get_device_info(self, device_mac: MAC_ADDR | None = None) -> DeviceInfo | None:

        """Return the DeviceInfo."""

        router_info = self.get_router_info(device_mac)

        device_name = self.primary_router_name
        device_ip = None
        connected_device = None
        effective_mac = device_mac

        if device_mac is not None:
            connected_device = self._connected_devices.get(device_mac)
            if connected_device:
                device_name = connected_device.name
                device_ip = connected_device.ip_address
            else:
                device_name = str(device_mac)

        if router_info:
            if effective_mac is None and router_info.mac_address:
                effective_mac = router_info.mac_address
            
            # 方式1: 从连接设备中查找匹配cfg_host的设备
            if effective_mac is None:
                for mac, cd in self._connected_devices.items():
                    if cd.ip_address == self.cfg_host:
                        effective_mac = mac
                        self._logger.debug("get_device_info: Found main router MAC from IP match: %s", effective_mac)
                        break
            
            # 方式2: 如果是主路由器(无device_mac)，查找is_router=True的设备
            if effective_mac is None and device_mac is None:
                for mac, cd in self._connected_devices.items():
                    if cd.is_router:
                        effective_mac = mac
                        self._logger.debug("get_device_info: Found main router MAC from is_router: %s", effective_mac)
                        break
            
            # 方式3: 如果是主路由器，查找名称包含"router"或"网关"的设备
            if effective_mac is None and device_mac is None:
                for mac, cd in self._connected_devices.items():
                    if cd.name and ("router" in cd.name.lower() or "网关" in cd.name or "Gateway" in cd.name):
                        effective_mac = mac
                        self._logger.debug("get_device_info: Found main router MAC from name: %s (%s)", effective_mac, cd.name)
                        break
            
            # 方式4: 从ARP表获取主路由器MAC
            if effective_mac is None and device_mac is None:
                effective_mac = self.get_primary_router_mac()
                if effective_mac:
                    self._logger.debug("get_device_info: Found main router MAC from ARP: %s", effective_mac)
            
            result = DeviceInfo(
                configuration_url=self.get_configuration_url(device_mac),
                identifiers={(DOMAIN, router_info.serial_number)},
                manufacturer=ATTR_MANUFACTURER,
                model=router_info.model,
                name=device_name,
                hw_version=router_info.hardware_version,
                sw_version=router_info.software_version,
                serial_number=router_info.serial_number,
                connections={("mac", str(effective_mac).lower())} if effective_mac else None,
            )
            if device_ip:
                result["configuration_url"] = f"http://{device_ip}"
        elif device_mac is not None:
            # 对子路由尝试获取 RouterInfo（含序列号、型号、固件版本）
            router_info = None
            if connected_device and connected_device.is_router:
                router_info = self.get_router_info(device_mac)

            # 子路由优先使用序列号作为标识符，确保同一设备的不同 MAC 合并
            if router_info and router_info.serial_number:
                identifiers = {(DOMAIN, router_info.serial_number)}
            else:
                identifiers = {(DOMAIN, str(device_mac))}

            result = DeviceInfo(
                identifiers=identifiers,
                name=device_name,
                connections={("mac", str(device_mac).lower())},
                configuration_url=f"http://{device_ip}" if device_ip else None,
            )

            if router_info:
                result["manufacturer"] = ATTR_MANUFACTURER
                result["model"] = router_info.model
                result["hw_version"] = router_info.hardware_version
                result["sw_version"] = router_info.software_version
                result["serial_number"] = router_info.serial_number

            if connected_device:
                if not connected_device.is_router:
                    dev_brands = connected_device._data.get("dev_brands")
                    if dev_brands:
                        result["manufacturer"] = dev_brands
                else:
                    if connected_device.host_name:
                        result["hw_version"] = connected_device.host_name
        else:
            self._logger.debug("Device info not found for %s", device_mac)
            return None

        return result



    def _safe_disconnect(self, api: HuaweiApi) -> None:

        """Disconnect from API."""

        try:

            self.hass.async_create_task(api.disconnect())

        except Exception as ex:

            self._logger.warning("Can not schedule disconnect: %s", str(ex))



    @suppress_exceptions_when_unloaded

    async def async_update(self) -> None:

        """Asynchronous update of all data."""

        self._logger.debug("Update started")

        await self._update_repeater_state()

        await self._update_zones()

        await self._update_wlan_filter_info()

        await self._update_connected_devices()

        await self._update_apis()

        await self._update_router_infos()

        await self._update_wan_info()

        await self._update_url_filter_info()

        await self._update_port_mappings()

        await self._update_time_control()

        await self._update_switches()

        await self._update_selects()

        self._logger.debug("Update completed")

        self._is_initial_update = False

        await self._auto_associate_devices()


    @suppress_update_exception("Can not update auto associate devices %s")
    async def _auto_associate_devices(self) -> None:
        """自动为其他集成的设备补上 MAC 连接，实现跨集成设备合并。

        三阶段策略：
        1. configuration_url IP 匹配（快速，覆盖大部分本地集成）
        2. Entity state 属性中的 IP 匹配（覆盖未设 configuration_url 的集成）
        3. 主机名匹配（针对 Sonoff/易微联等通过名称命名的设备）
        """
        if not self._integration_options.auto_associate_devices:
            return

        self._logger.warning("自动关联开始: connected=%d", len(self._connected_devices))

        import re

        dev_reg = dr.async_get(self.hass)
        ip_pat = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b")

        # ============ Phase 1: configuration_url IP 匹配 ============
        ip_to_others: dict[str, list[str]] = {}
        for device in dev_reg.devices.values():
            if any(i[0] == DOMAIN for i in device.identifiers):
                continue
            has_mac = any(c[0] == "mac" for c in device.connections)
            if has_mac:
                continue
            url = device.configuration_url or ""
            for ip in ip_pat.findall(url):
                ip_to_others.setdefault(ip, []).append(device.id)

        # ============ Phase 2: Entity state 属性 IP 扫描 ============
        for state in self.hass.states.async_all():
            did = None
            er = entity_registry.async_get(self.hass)
            entry = er.async_get(state.entity_id)
            if entry and entry.device_id:
                did = entry.device_id
            if not did:
                continue
            device = dev_reg.devices.get(did)
            if not device:
                continue
            if any(i[0] == DOMAIN for i in device.identifiers):
                continue
            if any(c[0] == "mac" for c in device.connections):
                continue

            for attr_val in state.attributes.values():
                if isinstance(attr_val, str):
                    for ip in ip_pat.findall(attr_val):
                        ip_to_others.setdefault(ip, []).append(did)
                        break

        if not ip_to_others:
            self._logger.warning("自动关联: 无 IP 匹配候选 (Phase1+2 均无发现)")
            # 即使无 IP 匹配，继续 Phase 4 MAC 匹配
        else:
            self._logger.warning("自动关联 Phase3: 候选IP=%s", list(ip_to_others.keys()))

        # ============ Phase 3: IP 匹配执行关联 ============
        ent_reg = entity_registry.async_get(self.hass)
        associated = 0

        # 构建 IP → huawei_router device_id 映射
        ip_to_hw: dict[str, str] = {}
        for device in dev_reg.devices.values():
            if not any(i[0] == DOMAIN for i in device.identifiers):
                continue
            url = device.configuration_url or ""
            for ip in ip_pat.findall(url):
                ip_to_hw[ip] = device.id

        # 构建 IP → MAC 映射（从路由器已连接设备列表）
        ip_to_mac: dict[str, str] = {}
        for mac, cd in self._connected_devices.items():
            ip = cd.ip_address
            if ip:
                ip_to_mac[ip] = mac

        for ip, other_ids in ip_to_others.items():
            hw_device_id = ip_to_hw.get(ip)
            if not hw_device_id:
                continue
            hw_device = dev_reg.devices.get(hw_device_id)
            if not hw_device:
                continue

            mac = ip_to_mac.get(ip)
            if not mac:
                self._logger.warning("关联跳过: IP=%s 无 MAC 信息", ip)
                continue

            self._logger.warning("自动关联 Phase3: hw[%s] IP=%s MAC=%s 匹配到 %d 个候选",
                hw_device.name, ip, mac, len(other_ids))

            for other_did in other_ids:
                pair_key = f"{hw_device_id}:{other_did}"
                if pair_key in self._associated_devices:
                    continue

                other = dev_reg.devices.get(other_did)
                if not other:
                    continue

                if hw_device_id not in dev_reg.devices:
                    self._logger.warning("关联跳过: hw_device 已不存在")
                    break

                try:
                    # 策略：把 huawei_router 实体转移到其他集成设备
                    # Step 1: 转移 huawei_router 实体 → 目标设备
                    moved = 0
                    for ent in list(ent_reg.entities.values()):
                        if ent.device_id == hw_device_id:
                            ent_reg.async_update_entity(
                                ent.entity_id,
                                device_id=other_did,
                            )
                            moved += 1

                    # Step 2: 删除 huawei_router 设备（释放 MAC 和 identifier）
                    dev_reg.async_remove_device(hw_device_id)

                    # Step 3: 给目标设备加 MAC connection
                    dev_reg.async_update_device(
                        other_did,
                        new_connections={("mac", mac.lower())},
                    )

                    # Step 4: 给目标设备加 huawei_router identifier
                    dev_reg.async_update_device(
                        other_did,
                        new_identifiers={(DOMAIN, mac)},
                    )

                    self._associated_devices.add(pair_key)
                    associated += 1
                    self._logger.warning(
                        "关联成功: %s (IP=%s, MAC=%s) → 转移 %d 个实体到 %s",
                        hw_device.name, ip, mac, moved, other.name,
                    )
                except Exception as exc:
                    self._logger.warning(
                        "关联失败 %s <-> %s: %s",
                        hw_device.name, other.name, exc,
                    )

                if hw_device_id not in dev_reg.devices:
                    break

            if hw_device_id not in dev_reg.devices:
                for other_ip in list(ip_to_hw.keys()):
                    if ip_to_hw[other_ip] == hw_device_id:
                        del ip_to_hw[other_ip]

        # ============ Phase 4: 从 identifier 提取 MAC 匹配 ============
        # 很多集成（miot、broadlink 等）在 identifier 中嵌入了 MAC 地址
        mac_pat = re.compile(
            r"(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})"
        )

        # 构建 MAC → huawei_router device_id 映射（从已连接设备）
        mac_to_hw: dict[str, str] = {}
        for device in dev_reg.devices.values():
            if not any(i[0] == DOMAIN for i in device.identifiers):
                continue
            for conn_type, conn_val in device.connections:
                if conn_type == "mac":
                    mac_to_hw[conn_val.lower()] = device.id
                    break

        self._logger.warning("自动关联 Phase4: mac_to_hw 有 %d 个条目, 扫描 %d 个非 hw 设备",
            len(mac_to_hw), sum(1 for d in dev_reg.devices.values()
                if not any(i[0] == DOMAIN for i in d.identifiers)
                and not any(c[0] == "mac" for c in d.connections)))

        for device in list(dev_reg.devices.values()):
            if any(i[0] == DOMAIN for i in device.identifiers):
                continue
            if any(c[0] == "mac" for c in device.connections):
                continue

            # 从 identifier 中提取 MAC
            found_mac = None
            for ident in device.identifiers:
                if isinstance(ident, (list, tuple)) and len(ident) > 1:
                    for val in ident[1:]:
                        if isinstance(val, str):
                            m = mac_pat.search(val)
                            if m:
                                found_mac = m.group(0).lower()
                                break
                if found_mac:
                    break

            if not found_mac:
                continue

            self._logger.warning("自动关联 Phase4: 设备[%s] identifier 含 MAC=%s",
                device.name, found_mac)

            hw_device_id = mac_to_hw.get(found_mac)
            if not hw_device_id:
                continue

            pair_key = f"{hw_device_id}:{device.id}"
            if pair_key in self._associated_devices:
                continue

            hw_device = dev_reg.devices.get(hw_device_id)
            if not hw_device:
                continue

            self._logger.warning("自动关联 Phase4: hw[%s] MAC=%s 匹配到 %s",
                hw_device.name, found_mac, device.name)

            try:
                # 策略：把其他集成的实体和 identifier 合并到 huawei_router 设备
                # 这样重启后 async_get_or_create 能自动匹配
                moved = 0
                for ent in list(ent_reg.entities.values()):
                    if ent.device_id == device.id:
                        ent_reg.async_update_entity(
                            ent.entity_id,
                            device_id=hw_device_id,
                        )
                        moved += 1

                # 先删除其他集成的空设备（释放 identifier）
                dev_reg.async_remove_device(device.id)

                # 再把其他集成的 identifier 加到 huawei_router 设备
                existing_idents = set(hw_device.identifiers)
                other_idents = set(device.identifiers)
                dev_reg.async_update_device(
                    hw_device_id,
                    new_identifiers=existing_idents | other_idents,
                )

                self._associated_devices.add(pair_key)
                associated += 1
                self._logger.warning(
                    "关联成功: %s (MAC=%s) 吸收 %s, 转移 %d 个实体",
                    hw_device.name, found_mac, device.name, moved,
                )
            except Exception as exc:
                self._logger.warning(
                    "关联失败 %s <-> %s: %s",
                    hw_device.name, device.name, exc,
                )

        if associated:
            self._logger.warning("自动关联: %d 组设备已合并", associated)

        return

        # Phase 5: 从 Sonoff 存储文件提取 MAC（Sonoff 的 MAC 在 extra 字段中）
        try:
            import json
            from pathlib import Path
            
            # 查找 Sonoff 存储文件
            storage_path = Path("/config/.storage")
            sonoff_files = list(storage_path.glob("sonoff/*.json"))
            
            if sonoff_files:
                sonoff_file = sonoff_files[0]
                with open(sonoff_file, 'r') as f:
                    sonoff_data = json.load(f)
                
                devices_data = sonoff_data.get('data', [])
                self._logger.warning("自动关联 Phase5: 找到 %d 个 Sonoff 设备", len(devices_data))
                
                # 先建立 deviceid -> mac 的映射
                deviceid_to_mac = {}
                for dev in devices_data:
                    mac = dev.get('extra', {}).get('mac', '').lower()
                    deviceid = dev.get('deviceid', '')
                    if mac and mac != '00:00:00:00:00:00' and deviceid:
                        deviceid_to_mac[deviceid] = mac

                # 从 ARP 表获取 MAC -> IP 映射（回退方案）
                arp_mac_to_ip: dict[str, str] = {}
                try:
                    with open("/proc/net/arp") as f:
                        for line in f:
                            parts = line.split()
                            if len(parts) >= 4:
                                ip, mac = parts[0], parts[3]
                                if mac != "00:00:00:00:00:00" and mac != "HWtype":
                                    arp_mac_to_ip[mac.lower()] = ip
                except Exception:
                    pass

                # 优先从 hass.data 获取 Sonoff 运行时 host（Zeroconf 发现后填充）
                deviceid_to_ip: dict[str, str] = {}
                sonoff_registries = self.hass.data.get("sonoff", {})
                self._logger.warning("自动关联 Phase5: hass.data[sonoff] 有 %d 个 registry, keys=%s",
                    len(sonoff_registries), list(sonoff_registries.keys())[:3])
                total_devices_in_registry = 0
                total_with_host = 0
                for registry in sonoff_registries.values():
                    total_devices_in_registry += len(registry.devices)
                    for did, xdev in registry.devices.items():
                        host = xdev.get("host", "")
                        if host:
                            total_with_host += 1
                            ip = host.split(":")[0] if ":" in host else host
                            deviceid_to_ip[did] = ip
                self._logger.warning("自动关联 Phase5: registry 共 %d 设备, 有 host=%d, 提取 IP=%d",
                    total_devices_in_registry, total_with_host, len(deviceid_to_ip))

                # 回退：从 ARP 表 + Sonoff extra.mac 补充未获取到的
                for dev in devices_data:
                    mac = dev.get('extra', {}).get('mac', '').lower()
                    deviceid = dev.get('deviceid', '')
                    if deviceid and deviceid not in deviceid_to_ip:
                        if mac in arp_mac_to_ip:
                            deviceid_to_ip[deviceid] = arp_mac_to_ip[mac]
                self._logger.warning("自动关联 Phase5: 合并后 deviceid_to_ip=%d",
                    len(deviceid_to_ip))

                # 从路由器已连接设备构建 IP -> MAC 映射
                ip_to_mac: dict[str, str] = {}
                for mac, cd in self._connected_devices.items():
                    ip = cd.ip_address
                    if ip:
                        ip_to_mac[ip] = mac

                self._logger.warning("自动关联 Phase5: deviceid_to_ip=%d, ip_to_mac=%d",
                    len(deviceid_to_ip), len(ip_to_mac))

                # 遍历所有 Sonoff 设备
                sonoff_total = 0
                sonoff_matched_registry = 0
                sonoff_matched_coordinator = 0
                sonoff_matched_ip = 0
                sonoff_no_mac = 0
                sonoff_mac_not_in_hw = 0
                for device in list(dev_reg.devices.values()):
                    if not any(i[0] == "sonoff" for i in device.identifiers):
                        continue
                    sonoff_total += 1
                    
                    # 获取 deviceid（从 Sonoff identifier 中提取）
                    deviceid = None
                    for ident in device.identifiers:
                        if isinstance(ident, (list, tuple)) and len(ident) >= 2 and ident[0] == "sonoff":
                            deviceid = str(ident[1])
                            break

                    # 获取 MAC：优先从已有连接，其次从 Sonoff 存储文件
                    mac = None
                    for conn_type, conn_val in device.connections:
                        if conn_type == "mac":
                            mac = conn_val.lower()
                            break
                    
                    if not mac:
                        if deviceid:
                            mac = deviceid_to_mac.get(deviceid)
                    
                    if not mac:
                        sonoff_no_mac += 1
                        continue
                    
                    # 检查是否能匹配到 huawei_router 设备
                    hw_device_id = mac_to_hw.get(mac)
                    
                    if hw_device_id:
                        # 可以直接合并
                        pair_key = f"{hw_device_id}:{device.id}"
                        if pair_key in self._associated_devices:
                            continue
                        
                        hw_device = dev_reg.devices.get(hw_device_id)
                        if not hw_device:
                            continue
                        
                        self._logger.warning("自动关联 Phase5: hw[%s] MAC=%s 匹配到 Sonoff[%s] deviceid=%s",
                            hw_device.name, mac, device.name, deviceid)
                        
                        try:
                            moved = 0
                            for ent in list(ent_reg.entities.values()):
                                if ent.device_id == device.id:
                                    ent_reg.async_update_entity(
                                        ent.entity_id,
                                        device_id=hw_device_id,
                                    )
                                    moved += 1
                            
                            dev_reg.async_remove_device(device.id)
                            
                            existing_idents = set(hw_device.identifiers)
                            other_idents = set(device.identifiers)
                            dev_reg.async_update_device(
                                hw_device_id,
                                new_identifiers=existing_idents | other_idents,
                            )
                            
                            self._associated_devices.add(pair_key)
                            associated += 1
                            sonoff_matched_registry += 1
                            self._logger.warning(
                                "关联成功: %s (MAC=%s) 吸收 Sonoff[%s], 转移 %d 个实体",
                                hw_device.name, mac, device.name, moved,
                            )
                        except Exception as exc:
                            self._logger.warning(
                                "关联失败 %s <-> Sonoff[%s]: %s",
                                hw_device.name, device.name, exc,
                            )
                    else:
                        # mac_to_hw 没找到，尝试从 _connected_devices 直接匹配
                        # _connected_devices 包含所有设备（含非活跃），而注册表只有活跃设备
                        hw_from_coordinator = self._connected_devices.get(mac)
                        if hw_from_coordinator:
                            # 动态创建注册表条目
                            device_info = self.get_device_info(mac)
                            if device_info:
                                try:
                                    hw_device = dev_reg.async_get_or_create(
                                        config_entry_id=self._config.entry_id,
                                        **device_info,
                                    )
                                    hw_device_id = hw_device.id
                                    pair_key = f"{hw_device_id}:{device.id}"
                                    if pair_key not in self._associated_devices:
                                        moved = 0
                                        for ent in list(ent_reg.entities.values()):
                                            if ent.device_id == device.id:
                                                ent_reg.async_update_entity(
                                                    ent.entity_id,
                                                    device_id=hw_device_id,
                                                )
                                                moved += 1

                                        dev_reg.async_remove_device(device.id)

                                        existing_idents = set(hw_device.identifiers)
                                        other_idents = set(device.identifiers)
                                        dev_reg.async_update_device(
                                            hw_device_id,
                                            new_identifiers=existing_idents | other_idents,
                                        )

                                        self._associated_devices.add(pair_key)
                                        associated += 1
                                        sonoff_matched_coordinator += 1
                                        self._logger.warning(
                                            "关联成功: %s (MAC=%s) 吸收 Sonoff[%s], 转移 %d 个实体",
                                            hw_device.name, mac, device.name, moved,
                                        )
                                        continue
                                except Exception as exc:
                                    self._logger.warning(
                                        "动态创建注册表条目失败 MAC=%s: %s", mac, exc,
                                    )

                        # MAC 匹配失败，尝试 IP 匹配
                        ip_matched = False
                        if deviceid and deviceid in deviceid_to_ip:
                            sonoff_ip = deviceid_to_ip[deviceid]
                            matched_mac = ip_to_mac.get(sonoff_ip)
                            if matched_mac:
                                hw_from_ip = self._connected_devices.get(matched_mac)
                                if hw_from_ip:
                                    device_info = self.get_device_info(matched_mac)
                                    if device_info:
                                        try:
                                            hw_device = dev_reg.async_get_or_create(
                                                config_entry_id=self._config.entry_id,
                                                **device_info,
                                            )
                                            hw_device_id = hw_device.id
                                            pair_key = f"{hw_device_id}:{device.id}"
                                            if pair_key not in self._associated_devices:
                                                moved = 0
                                                for ent in list(ent_reg.entities.values()):
                                                    if ent.device_id == device.id:
                                                        ent_reg.async_update_entity(
                                                            ent.entity_id,
                                                            device_id=hw_device_id,
                                                        )
                                                        moved += 1

                                                dev_reg.async_remove_device(device.id)

                                                existing_idents = set(hw_device.identifiers)
                                                other_idents = set(device.identifiers)
                                                dev_reg.async_update_device(
                                                    hw_device_id,
                                                    new_identifiers=existing_idents | other_idents,
                                                )

                                                self._associated_devices.add(pair_key)
                                                associated += 1
                                                sonoff_matched_ip += 1
                                                ip_matched = True
                                                self._logger.warning(
                                                    "关联成功: %s (IP=%s MAC=%s) 吸收 Sonoff[%s], 转移 %d 个实体",
                                                    hw_device.name, sonoff_ip, matched_mac,
                                                    device.name, moved,
                                                )
                                        except Exception as exc:
                                            self._logger.warning(
                                                "IP 匹配创建注册表条目失败 IP=%s MAC=%s: %s",
                                                sonoff_ip, matched_mac, exc,
                                            )

                        if ip_matched:
                            continue

                        # 仍不能匹配，给 Sonoff 设备添加 MAC 连接
                        sonoff_mac_not_in_hw += 1
                        try:
                            current_conns = set(device.connections)
                            new_conn = ("mac", mac)
                            if new_conn not in current_conns:
                                dev_reg.async_update_device(
                                    device.id,
                                    new_connections={new_conn},
                                )
                                self._logger.warning(
                                    "自动关联 Phase5: 给 Sonoff[%s] 添加 MAC=%s 连接",
                                    device.name, mac,
                                )
                        except Exception as exc:
                            self._logger.warning(
                                "给 Sonoff[%s] 添加 MAC 失败: %s",
                                device.name, exc,
                            )
                self._logger.warning(
                    "自动关联 Phase5 汇总: 注册表%d个Sonoff, 无MAC=%d, 注册表匹配=%d, 协调器匹配=%d, IP匹配=%d, MAC不在HW=%d",
                    sonoff_total, sonoff_no_mac, sonoff_matched_registry,
                    sonoff_matched_coordinator, sonoff_matched_ip, sonoff_mac_not_in_hw,
                )
        except Exception as exc:
            self._logger.warning("自动关联 Phase5 初始化失败: %s", exc)

        if associated:
            self._logger.warning("自动关联: %d 组设备已合并", associated)
    async def _update_time_control(self) -> None:



        if not self._integration_options.time_control_switches:

            return



        if not await self.primary_router_api.is_feature_available(Feature.TIME_CONTROL):

            return



        self._logger.debug("Updating time control items")



        time_control_items: dict[str, HuaweiTimeControlItem] = {

            item.id: item

            for item in await self.primary_router_api.get_time_control_items()

        }



        missing_item_ids: list[str] = []

        for existing_item in self._time_control_items.values():

            updated_item = time_control_items.get(existing_item.id)

            if not updated_item:

                missing_item_ids.append(existing_item.id)

                continue



            existing_item.update(updated_item)



        if missing_item_ids:

            for missing_id in missing_item_ids:

                del self._time_control_items[missing_id]



        for updated_item in time_control_items.values():

            if updated_item.id not in self._time_control_items:

                self._time_control_items[updated_item.id] = updated_item



        self._logger.debug("Time control items updated")



    @suppress_update_exception("Can not update port mappings %s")

    async def _update_port_mappings(self) -> None:



        if not self._integration_options.port_mapping_switches:

            return



        if not await self.primary_router_api.is_feature_available(Feature.PORT_MAPPING):

            return



        self._logger.debug("Updating port mappings")



        new_port_mappings = {

            item.id: item for item in await self.primary_router_api.get_port_mappings()

        }



        missing_port_mapping_ids: list[str] = []

        for existing_port_mapping in self._port_mappings.values():

            updated_port_mapping = new_port_mappings.get(existing_port_mapping.id)

            if not updated_port_mapping:

                missing_port_mapping_ids.append(existing_port_mapping.id)

                continue



            existing_port_mapping.update_info(

                name=updated_port_mapping.name,

                enabled=updated_port_mapping.enabled,

                host_name=updated_port_mapping.host_name,

                host_ip=updated_port_mapping.host_ip,

                host_mac=updated_port_mapping.host_mac,

            )



        if missing_port_mapping_ids:

            for missing_id in missing_port_mapping_ids:

                del self._port_mappings[missing_id]



        for updated_port_mapping in new_port_mappings.values():

            if updated_port_mapping.id not in self._port_mappings:

                self._port_mappings[updated_port_mapping.id] = PortMapping(

                    updated_port_mapping.id,

                    updated_port_mapping.name,

                    updated_port_mapping.enabled,

                    updated_port_mapping.host_name,

                    updated_port_mapping.host_ip,

                    updated_port_mapping.host_mac,

                )



        self._logger.debug("Port mappings updated")



    @suppress_update_exception("Can not update repeater state %s")

    async def _update_repeater_state(self) -> None:

        self._logger.debug("Updating repeater state")

        self._is_repeater = await self.primary_router_api.get_is_repeater()

        self._logger.debug("Repeater state updated: %s", self._is_repeater)



    @suppress_update_exception("Can not update zones %s")

    async def _update_zones(self) -> None:

        if not self._integration_options.device_tracker_zones:

            return

        self._logger.debug("Updating zones")



        if not self._zones_map.is_loaded:

            await self._zones_map.load()



        def get_zones() -> Iterable[ZoneInfo]:

            er = entity_registry.async_get(self.hass)

            for er_entity_id, er_entry in er.entities.items():

                if er_entry.domain == ZONE_DOMAIN:

                    yield ZoneInfo(

                        name=er_entry.name or er_entry.original_name,

                        entity_id=er_entity_id,

                    )



        self._zones = list(sorted(get_zones(), key=lambda zone: zone.name))



        self._logger.debug("Zones updated")



    @suppress_update_exception("Can not update wan info: %s")

    async def _update_wan_info(self) -> None:

        self._logger.debug("Updating wan info")

        self._wan_info = await self.primary_router_api.get_wan_connection_info()

        self._logger.debug("Wan info updated")



    @suppress_update_exception("Can not update wlan filter info: %s")

    async def _update_wlan_filter_info(self) -> None:

        self._logger.debug("Updating wlan filter info")

        primary_api = self.primary_router_api

        if await primary_api.is_feature_available(Feature.WLAN_FILTER):

            _, info_5g = await primary_api.get_wlan_filter_info()

            # ignore 2.4GHz information

            self._wlan_filter_info = info_5g

        else:

            self._wlan_filter_info = None

        self._logger.debug("Wlan filter info updated")



    @suppress_update_exception("Can not update router infos: %s")

    async def _update_router_infos(self) -> None:

        """Asynchronous update of routers information."""

        self._logger.debug("Updating routers info")

        for device_mac, api in self._apis.items():

            await self._update_router_info(device_mac, api)

        self._logger.debug("Routers info updated")



    @suppress_update_exception("Can not update router info: %s")

    async def _update_router_info(self, device_mac: MAC_ADDR, api: HuaweiApi) -> None:

        """Asynchronous update of router information."""

        self._logger.debug("Updating router %s info", device_mac)

        self._router_infos[device_mac] = await api.get_router_info()

        self._logger.debug("Router info: updated for '%s'", device_mac)



    def unload(self) -> None:

        """Unload the coordinator and disconnect from API."""

        self._is_unloaded = True

        self._logger.debug("Coordinator is unloaded")

        for router_api in self._apis.values():

            self._safe_disconnect(router_api)



    @suppress_update_exception("Can not update apis: %s")

    async def _update_apis(self) -> None:

        """Asynchronous update of available apis."""



        @callback

        def on_router_added(device_mac: MAC_ADDR, router: ConnectedDevice) -> None:

            """When a new mesh router is detected."""

            if device_mac not in self._apis:

                self._logger.debug(

                    "New router '%s' discovered at %s", device_mac, router.ip_address

                )

                router_api = HuaweiApi(

                    host=router.ip_address,

                    port=80,

                    use_ssl=False,

                    user=self._config.data[CONF_USERNAME],

                    password=self._config.data[CONF_PASSWORD],

                    verify_ssl=False,

                )

                self._apis[device_mac] = router_api



                if not self._is_initial_update:

                    self._events.fire_router_added(

                        self.primary_router_serial_number,

                        device_mac,

                        router.ip_address,

                        router.name,

                    )



        @callback

        def on_router_removed(_, device_mac: MAC_ADDR, router: ConnectedDevice) -> None:

            """When a known mesh router becomes unavailable."""

            self._logger.debug("Router '%s' disconnected", device_mac)

            router_api = self._apis.pop(device_mac, None)

            if router_api:

                self._safe_disconnect(router_api)



            if not self._is_initial_update:

                self._events.fire_router_removed(

                    self.primary_router_serial_number,

                    device_mac,

                    router.ip_address,

                    router.name,

                )



        self._logger.debug("Updating apis")

        self._routersWatcher.look_for_changes(on_router_added, on_router_removed)



    @suppress_update_exception("Can not update selects: %s")

    async def _update_selects(self) -> None:

        """Asynchronous update of selects states."""

        self._logger.debug("Updating selects states")



        new_states: dict[Select | str, str] = {}



        if await self.primary_router_api.is_feature_available(Feature.WLAN_FILTER):

            mode = self._wlan_filter_info.mode if self._wlan_filter_info else None

            if mode is None:

                state = None

            elif mode == FilterMode.WHITELIST:

                state = HuaweiWlanFilterMode.WHITELIST

            elif mode == FilterMode.BLACKLIST:

                state = HuaweiWlanFilterMode.BLACKLIST

            else:

                self._logger.warning("Unsupported FilterMode %s", mode)

                state = None

            new_states[Select.WLAN_FILTER_MODE] = state

            self._logger.debug("WLan filter mode select state updated to %s", state)



        if self._integration_options.device_tracker_zones:

            self._logger.debug("Updating Zone select for %s", _PRIMARY_ROUTER_IDENTITY)

            state = self._zones_map.get_zone_id(_PRIMARY_ROUTER_IDENTITY)

            new_states[Select.ROUTER_ZONE] = state

            self._logger.debug(

                "Zone (%s) state updated to %s", _PRIMARY_ROUTER_IDENTITY, state

            )



            for mac, api in self._apis.items():

                if mac == _PRIMARY_ROUTER_IDENTITY:

                    continue

                device = self._connected_devices.get(mac)

                self._logger.debug(

                    "Updating Zone select for %s", device.name if device else mac

                )

                if device and device.is_active:

                    state = self._zones_map.get_zone_id(device.mac)

                else:

                    state = None

                new_states[f"{Select.ROUTER_ZONE}_{mac}"] = state

                self._logger.debug(

                    "Zone (%s) state updated to %s",

                    device.name if device else mac,

                    state,

                )



        self._logger.debug("Selects states updated")

        self._select_states = new_states



    @suppress_update_exception("Can not update URL filters: %s")

    async def _update_url_filter_info(self) -> None:

        """Asynchronous update of URL filters."""

        self._logger.debug("Updating URL filters")



        primary_api = self.primary_router_api



        if not await primary_api.is_feature_available(Feature.URL_FILTER):

            return



        url_filter_infos: dict[str, HuaweiUrlFilterInfo] = {

            item.filter_id: item for item in await primary_api.get_url_filter_info()

        }



        missing_filter_ids: list[str] = []

        for existing_filter in self._url_filters.values():

            updated_filter_info = url_filter_infos.get(existing_filter.filter_id)

            if not updated_filter_info:

                missing_filter_ids.append(existing_filter.filter_id)

                continue



            existing_filter.update_info(

                url=updated_filter_info.url,

                dev_manual=updated_filter_info.dev_manual,

                enabled=updated_filter_info.enabled,

                devices=updated_filter_info.devices,

            )



        if missing_filter_ids:

            for missing_id in missing_filter_ids:

                del self._url_filters[missing_id]



        for updated_filter_info in url_filter_infos.values():

            if updated_filter_info.filter_id not in self._url_filters:

                self._url_filters[updated_filter_info.filter_id] = UrlFilter(

                    updated_filter_info.filter_id,

                    updated_filter_info.url,

                    updated_filter_info.enabled,

                    updated_filter_info.dev_manual,

                    updated_filter_info.devices,

                )



        self._logger.debug("URL filters updated")



    @suppress_update_exception("Can not update switches: %s")

    async def _update_switches(self) -> None:

        """Asynchronous update of switch states."""

        self._logger.debug("Updating switches states")



        primary_api = self._select_api(_PRIMARY_ROUTER_IDENTITY)



        new_states: dict[Switch | EmulatedSwitch | str, bool] = {}



        if await primary_api.is_feature_available(Feature.WIFI_80211R):

            state = await primary_api.get_switch_state(Switch.WIFI_80211R)

            new_states[Switch.WIFI_80211R] = state

            self._logger.debug("80211r switch state updated to %s", state)



        if await primary_api.is_feature_available(Feature.WIFI_TWT):

            state = await primary_api.get_switch_state(Switch.WIFI_TWT)

            new_states[Switch.WIFI_TWT] = state

            self._logger.debug("TWT switch state updated to %s", state)



        if await primary_api.is_feature_available(Feature.NFC):

            state = await primary_api.get_switch_state(Switch.NFC)

            new_states[Switch.NFC] = state

            self._logger.debug("Nfc switch (primary router) state updated to %s", state)



        if await primary_api.is_feature_available(Feature.WLAN_FILTER):

            state = await primary_api.get_switch_state(Switch.WLAN_FILTER)

            new_states[Switch.WLAN_FILTER] = state

            self._logger.debug("WLan filter switch state updated to %s", state)



        if await primary_api.is_feature_available(Feature.GUEST_NETWORK):

            state = await primary_api.get_switch_state(Switch.GUEST_NETWORK)

            new_states[Switch.GUEST_NETWORK] = state

            self._logger.debug("Guest network switch state updated to %s", state)



        for mac, api in self._apis.items():

            if mac == _PRIMARY_ROUTER_IDENTITY:

                continue

            device = self._connected_devices.get(mac)

            if device and device.is_active:

                await self.update_router_nfc_switch(api, device, new_states)



        await self.calculate_device_access_switch_states(new_states)

        await self.calculate_url_filter_switch_states(new_states)

        await self.calculate_port_mapping_switches(new_states)

        await self.calculate_time_control_switch_states(new_states)



        self._switch_states = new_states

        self._logger.debug("Switches states updated")



    @suppress_update_exception("Can not update NFC switch state: %s")

    async def update_router_nfc_switch(

        self,

        api: HuaweiApi,

        device: ConnectedDevice,

        new_states: dict[Switch | str, bool],

    ):

        if await api.is_feature_available(Feature.NFC):

            self._logger.debug("Updating nfc switch for %s", device.name)

            state = await api.get_switch_state(Switch.NFC)

            new_states[f"{Switch.NFC}_{device.mac}"] = state

            self._logger.debug(

                "Nfc switch (%s) state updated to %s", device.name, state

            )



    async def calculate_device_access_switch_states(

        self, states: dict[Switch | EmulatedSwitch | str, bool] | None = None

    ) -> None:

        """Update device access switch states."""

        if not self._integration_options.wifi_access_switches:

            return



        states = states or self._switch_states



        if await self.primary_router_api.is_feature_available(Feature.WLAN_FILTER):

            for device in self.connected_devices.values():

                if not ClientWirelessDevicesWatcher.filter(device):

                    continue

                if not self._wlan_filter_info:

                    continue



                if self._wlan_filter_info.mode == FilterMode.WHITELIST:

                    state = device.filter_mode == HuaweiWlanFilterMode.WHITELIST

                elif self._wlan_filter_info.mode == FilterMode.BLACKLIST:

                    state = device.filter_mode != HuaweiWlanFilterMode.BLACKLIST

                else:

                    state = None



                states[f"{EmulatedSwitch.DEVICE_ACCESS}_{device.mac}"] = state

                self._logger.debug(

                    "Device access switch (%s) state updated to %s", device.name, state

                )



    async def calculate_url_filter_switch_states(

        self, states: dict[Switch | EmulatedSwitch | str, bool] | None = None

    ) -> None:

        """Update url filter switch states."""

        if not self._integration_options.url_filter_switches:

            return



        states = states or self._switch_states



        if await self.primary_router_api.is_feature_available(Feature.URL_FILTER):

            for item in self._url_filters.values():

                states[f"{EmulatedSwitch.URL_FILTER}_{item.filter_id}"] = item.enabled

                self._logger.debug(

                    "URL filter switch (%s) state updated to %s",

                    item.filter_id,

                    item.enabled,

                )



    async def calculate_time_control_switch_states(

        self, states: dict[Switch | EmulatedSwitch | str, bool] | None = None

    ) -> None:

        """Update time control switch states."""

        if not self._integration_options.time_control_switches:

            return



        states = states or self._switch_states



        if await self.primary_router_api.is_feature_available(Feature.TIME_CONTROL):

            for item in self._time_control_items.values():

                states[f"{EmulatedSwitch.TIME_CONTROL}_{item.id}"] = item.enabled

                self._logger.debug(

                    "Time control switch (%s) state updated to %s",

                    item.id,

                    item.enabled,

                )



    async def calculate_port_mapping_switches(

        self, states: dict[Switch | EmulatedSwitch | str, bool] | None = None

    ) -> None:

        """Update url filter switch states."""

        if not self._integration_options.port_mapping_switches:

            return



        states = states or self._switch_states



        if await self.primary_router_api.is_feature_available(Feature.PORT_MAPPING):

            for item in self._port_mappings.values():

                states[f"{EmulatedSwitch.PORT_MAPPING}_{item.id}"] = item.enabled

                self._logger.debug(

                    "Port mapping switch (%s) state updated to %s",

                    item.id,

                    item.enabled,

                )



    @suppress_update_exception("Can not update connected devices: %s")

    async def _update_connected_devices(self) -> None:

        """Asynchronous update of connected devices."""

        self._logger.debug("Updating connected devices")

        primary_api = self.primary_router_api



        devices_data = await primary_api.get_known_devices()



        if await primary_api.is_feature_available(Feature.DEVICE_TOPOLOGY):

            devices_topology = await primary_api.get_devices_topology()

        else:

            devices_topology = []



        # recursively search all HiLink routers with connected devices

        def get_mesh_routers(

            devices: Iterable[HuaweiDeviceNode]

        ) -> Iterable[HuaweiDeviceNode]:

            for candidate in devices:

                if candidate.hilink_type == NODE_HILINK_TYPE_DEVICE:

                    yield candidate

                for connected_router in get_mesh_routers(candidate.connected_devices):

                    yield connected_router


        mesh_routers = list(get_mesh_routers(devices_topology))

        # Fallback: If no routers found from topology, detect from devices_data
        if not mesh_routers:
            _LOGGER.warning(
                "No routers found from device topology. Trying fallback detection from HostInfo."
            )
            for device in devices_data:
                if device.is_router:
                    _LOGGER.info(
                        "Fallback detected router: %s (MAC: %s, HostName: %s)",
                        device.actual_name,
                        device.mac_address,
                        device.host_name,
                    )
                    # Create a virtual HuaweiDeviceNode for this router
                    mesh_routers.append(
                        HuaweiDeviceNode(device.mac_address, "Device")
                    )



        # [MAC_ADDRESS_OF_DEVICE, { "name": PARENT_ROUTER_NAME, "id": PARENT_ROUTER_MAC, "zone": ROUTER_ZONE}]

        devices_to_routers: dict[MAC_ADDR, Any] = {}

        for mesh_router in mesh_routers:

            # find same device in devices_data by MAC address

            router = next(

                (

                    item

                    for item in devices_data

                    if item.mac_address == mesh_router.mac_address

                ),

                # if device information not found

                HuaweiClientDevice(

                    {

                        "ActualName": mesh_router.mac_address,

                        "MACAddress": mesh_router.mac_address,

                    }

                ),

            )

            # devices_to_routers[device_mac] = router_info

            for mesh_connected_device in mesh_router.connected_devices:

                devices_to_routers[mesh_connected_device.mac_address] = {

                    "name": router.actual_name,

                    "id": router.mac_address,

                }



        # [MAC_ADDRESS_OF_DEVICE, Whitelist | Blacklist]

        devices_to_filters: dict[MAC_ADDR, HuaweiWlanFilterMode] = {}

        if self._wlan_filter_info:

            for blacklisted in self._wlan_filter_info.blacklist:

                devices_to_filters[blacklisted.mac_address] = (

                    HuaweiWlanFilterMode.BLACKLIST

                )

            for whitelisted in self._wlan_filter_info.whitelist:

                devices_to_filters[whitelisted.mac_address] = (

                    HuaweiWlanFilterMode.WHITELIST

                )



        if self._integration_options.devices_tags and not self._tags_map.is_loaded:

            await self._tags_map.load()



        for device_data in devices_data:

            mac: MAC_ADDR = device_data.mac_address

            ip_address: str = device_data.ip_address

            host_name: str = device_data.host_name or f"device_{mac}"

            name: str = device_data.actual_name or host_name

            is_active: bool = device_data.is_active

            filter_mode: HuaweiWlanFilterMode = devices_to_filters.get(mac)

            interface_type: HuaweiInterfaceType = device_data.interface_type



            # if nothing is found in the devices_to_routers, then the device is connected to the primary router

            connected_via = devices_to_routers.get(

                mac,

                {"name": self.primary_router_name, "id": CONNECTED_VIA_ID_PRIMARY},

            )



            tags = (

                self._tags_map.get_tags(mac)

                if self._integration_options.devices_tags

                else []

            )



            if mac in self._connected_devices:

                device = self._connected_devices[mac]

            else:

                device = ConnectedDevice(

                    name,

                    host_name,

                    mac,

                    is_active,

                    tags,

                    filter_mode,

                    interface_type=interface_type,

                    is_router=device_data.is_router,

                )

                self._connected_devices[device.mac] = device

                # new device = fire an event immediately

                if not self._is_initial_update:

                    self._events.fire_device_connected(

                        self.primary_router_serial_number,

                        mac,

                        ip_address,

                        name,

                        connected_via.get("id"),

                        connected_via.get("name"),

                    )



            # if state of the device is changed then firing an event

            if not self._is_initial_update and device.is_active != is_active:

                if is_active:

                    self._events.fire_device_connected(

                        self.primary_router_serial_number,

                        mac,

                        ip_address,

                        name,

                        connected_via.get("id"),

                        connected_via.get("name"),

                    )

                else:

                    self._events.fire_device_disconnected(

                        self.primary_router_serial_number,

                        mac,

                        ip_address,

                        name,

                        device.connected_via_id,

                        device.connected_via_name,

                    )



            if is_active:



                zone_id = None



                if self._integration_options.device_tracker_zones:

                    if device_data.is_router:

                        zone_id = self._zones_map.get_zone_id(mac)

                    elif connected_via.get("id") == CONNECTED_VIA_ID_PRIMARY:

                        zone_id = self._zones_map.get_zone_id(_PRIMARY_ROUTER_IDENTITY)

                    else:

                        zone_id = self._zones_map.get_zone_id(connected_via.get("id"))



                zone_name = (

                    next(

                        (

                            zone.name

                            for zone in self._zones

                            if zone.entity_id == zone_id

                        ),

                        None,

                    )

                    if zone_id

                    else None

                )



                if not self._is_initial_update:

                    if (

                        device.connected_via_id

                        and device.connected_via_id != connected_via.get("id")

                    ):

                        self._events.fire_device_changed_router(

                            self.primary_router_serial_number,

                            mac,

                            ip_address,

                            name,

                            device.connected_via_id,

                            device.connected_via_name,

                            connected_via.get("id"),

                            connected_via.get("name"),

                        )



                device.update_device_data(
                    name,
                    host_name,
                    True,
                    tags,
                    filter_mode,
                    connected_via=connected_via.get("name"),
                    ip_address=ip_address,
                    interface_type=interface_type,
                    rssi=device_data.rssi,
                    is_guest=device_data.is_guest,
                    is_hilink=device_data.is_hilink,
                    is_router=device_data.is_router,
                    connected_via_id=connected_via.get("id"),
                    zone=(
                        ZoneInfo(name=zone_name, entity_id=zone_id) if zone_id else None
                    ),
                    upload_rate_kilobytes_s=device_data.upload_rate,
                    download_rate_kilobytes_s=device_data.download_rate,
                    upload_rate=get_readable_rate(device_data.upload_rate),
                    download_rate=get_readable_rate(device_data.download_rate),
                    uptime=device_data.uptime,
                    connection_rate=device_data._data.get("rate"),
                    frequency=device_data._data.get("Frequency"),
                    dev_brands=device_data._data.get("DevBrands"),
                    icon_type=device_data._data.get("IconType"),
                    tx_kbytes=device_data._data.get("TxKBytes"),
                    rx_kbytes=device_data._data.get("RxKBytes"),
                    parent_control=device_data._data.get("ParentControl"),
                )

            else:

                device.update_device_data(

                    name,

                    host_name,

                    False,

                    tags,

                    filter_mode,

                    ip_address=ip_address,

                    interface_type=interface_type,

                    is_guest=device_data.is_guest,
                    is_hilink=device_data.is_hilink,
                    is_router=device_data.is_router,
                    connected_via_id=connected_via.get("id"),
                    connection_rate=device_data._data.get("rate"),
                    frequency=device_data._data.get("Frequency"),
                    dev_brands=device_data._data.get("DevBrands"),
                    icon_type=device_data._data.get("IconType"),
                    tx_kbytes=device_data._data.get("TxKBytes"),
                    rx_kbytes=device_data._data.get("RxKBytes"),
                    parent_control=device_data._data.get("ParentControl"),
                )



        self._logger.debug("Connected devices updated")



    def _select_api(self, device_mac: MAC_ADDR | None) -> HuaweiApi:

        """Return the api for the specified device."""

        api = self._apis.get(device_mac or _PRIMARY_ROUTER_IDENTITY)

        if not api:

            raise CoordinatorError(

                f"Can not find api for device '{device_mac or _PRIMARY_ROUTER_IDENTITY}'"

            )

        return api



    async def is_feature_available(

        self, feature: Feature, device_mac: MAC_ADDR | None = None

    ) -> bool:

        """Return true if specified feature is known and available."""

        return await self._select_api(device_mac).is_feature_available(feature)



    def get_switch_state(

        self,

        switch_name: Switch | EmulatedSwitch,

        device_mac: MAC_ADDR | None = None,

        switch_id: str | None = None,

    ) -> bool | None:

        """Return the state of the specified switch."""

        key = switch_name

        if switch_id:

            key = f"{key}_{switch_id}"

        if device_mac:

            key = f"{key}_{device_mac}"

        return self._switch_states.get(key)



    async def set_switch_state(

        self,

        switch: Switch | EmulatedSwitch,

        state: bool,

        device_mac: MAC_ADDR | None = None,

        switch_id: str | None = None,

    ) -> None:

        """Set state of the specified switch."""



        key = switch

        if switch_id:

            key = f"{key}_{switch_id}"

        if device_mac:

            key = f"{key}_{device_mac}"



        # Device access switch processing

        if switch == EmulatedSwitch.DEVICE_ACCESS:

            # add to whitelist when ON, add to blacklist otherwise

            filter_mode = FilterMode.WHITELIST if state else FilterMode.BLACKLIST

            await self.primary_router_api.apply_wlan_filter(

                filter_mode, FilterAction.ADD, device_mac

            )



        # URL filter switch processing

        elif switch == EmulatedSwitch.URL_FILTER:

            if not switch_id:

                raise CoordinatorError(

                    f"Can not set value: switch_id is required for {EmulatedSwitch.URL_FILTER}"

                )

            filter_item = self._url_filters.get(switch_id)

            if filter_item.enabled == state:

                return

            filter_item.set_enabled(state)



            filter_info = HuaweiUrlFilterInfo(

                filter_id=filter_item.filter_id,

                url=filter_item.url,

                enabled=filter_item.enabled,

                dev_manual=filter_item.dev_manual,

                devices=list(filter_item.devices),

            )



            await self.primary_router_api.apply_url_filter_info(filter_info)



        # Port mapping switch processing

        elif switch == EmulatedSwitch.PORT_MAPPING:

            if not switch_id:

                raise CoordinatorError(

                    f"Can not set value: switch_id is required for {EmulatedSwitch.PORT_MAPPING}"

                )

            port_mapping = self._port_mappings.get(switch_id)

            if port_mapping.enabled == state:

                return



            port_mapping.set_enabled(state)



            await self.primary_router_api.set_port_mapping_state(

                port_mapping.id, port_mapping.enabled

            )



        # Time control switch processing

        elif switch == EmulatedSwitch.TIME_CONTROL:

            if not switch_id:

                raise CoordinatorError(

                    f"Can not set value: switch_id is required for {EmulatedSwitch.TIME_CONTROL}"

                )

            time_control = self._time_control_items.get(switch_id)

            if time_control.enabled == state:

                return



            time_control.set_enabled(state)



            await self.primary_router_api.set_time_control_item_state(

                time_control.id, time_control.enabled

            )



        # other switches

        else:

            api = self._select_api(device_mac)

            await api.set_switch_state(switch, state)



        self._switch_states[key] = state



    def get_select_state(

        self, select: Select, device_mac: MAC_ADDR | None = None

    ) -> str | None:

        """Return the state of the specified select."""

        key = select if not device_mac else f"{select}_{device_mac}"

        state = self._select_states.get(key)

        return state



    async def set_select_state(

        self, select: Select, state: str, device_mac: MAC_ADDR | None = None

    ) -> None:

        """Set state of the specified select."""

        api = self._select_api(device_mac)



        # WLAN Filter Mode select

        if select == Select.WLAN_FILTER_MODE and await api.is_feature_available(

            Feature.WLAN_FILTER

        ):

            if state == HuaweiWlanFilterMode.BLACKLIST:

                await api.set_wlan_filter_mode(FilterMode.BLACKLIST)

            elif state == HuaweiWlanFilterMode.WHITELIST:

                await api.set_wlan_filter_mode(FilterMode.WHITELIST)

            else:

                raise CoordinatorError(f"Unsupported HuaweiWlanFilterMode: {state}")



        # Router's zone select

        elif select == Select.ROUTER_ZONE:

            await self._zones_map.set_zone_id(

                device_mac or _PRIMARY_ROUTER_IDENTITY, state

            )



        # Unknown select

        else:

            raise CoordinatorError(f"Unsupported select: {select}")



        key = select if not device_mac else f"{select}_{device_mac}"

        self._select_states[key] = state



    async def execute_action(

        self, action: Action, device_mac: MAC_ADDR | None = None

    ) -> None:

        """Perform the specified action."""

        api = self._select_api(device_mac)

        await api.execute_action(action)



    # ---------------------------

    #   async_subscribe_event

    # ---------------------------

    @callback

    def async_subscribe_event(

        self, event_types: list[str], handle_callback: CALLBACK_TYPE

    ) -> Callable[[], None]:

        return self._events.async_subscribe_event(event_types, handle_callback)

