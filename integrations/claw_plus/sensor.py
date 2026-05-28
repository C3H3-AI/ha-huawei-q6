from __future__ import annotations

import logging

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, CLAW_DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> bool:
    sensor = ClawConfigSensor(hass, entry)
    async_add_entities([sensor])
    return True


class ClawConfigSensor(SensorEntity):

    _attr_has_entity_name = True
    _attr_icon = "mdi:tune"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_should_poll = False

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_claw_config"
        self._attr_name = "Claw Config"
        self._attr_native_value = "OK"

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry.entry_id)},
            name="Claw Dashboard Config",
            manufacturer="claw_plus",
            model="Config Plus",
        )

    @property
    def extra_state_attributes(self) -> dict:
        entries = self.hass.config_entries.async_entries(CLAW_DOMAIN)
        if entries:
            return dict(entries[0].options)
        return {}

    async def async_update_config(self):
        self.async_write_ha_state()
