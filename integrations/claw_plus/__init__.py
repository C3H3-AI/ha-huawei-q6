from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN, CLAW_DOMAIN

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["sensor"]

SERVICE_SET_OPTION = "set_option"
SET_OPTION_SCHEMA = vol.Schema({
    vol.Required("key"): cv.string,
    vol.Required("value"): vol.Any(bool, int, float, str, None),
})


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    async def handle_set_option(call: ServiceCall) -> None:
        key = call.data["key"]
        value = call.data["value"]
        claw_entries = hass.config_entries.async_entries(CLAW_DOMAIN)
        if not claw_entries:
            _LOGGER.warning("No claw_assistant config entry found")
            return
        claw_entry = claw_entries[0]
        new_options = dict(claw_entry.options)
        new_options[key] = value
        hass.config_entries.async_update_entry(claw_entry, options=new_options)

    hass.services.async_register(
        DOMAIN, SERVICE_SET_OPTION, handle_set_option, schema=SET_OPTION_SCHEMA,
    )

    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    return unload_ok