"""HACS Vision - HACS 增强面板."""
from __future__ import annotations
import logging
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.typing import ConfigType
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers import config_validation as cv
import voluptuous as vol

from .const import DOMAIN, PANEL_TITLE, PANEL_ICON

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = vol.Schema({DOMAIN: vol.Schema({})}, extra=vol.ALLOW_EXTRA)

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    hass.data.setdefault(DOMAIN, {})
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigType) -> bool:
    """Set up HACS Vision from a config entry."""
    from .api import HACSEnhancedAPI, HACSEnhancedStaticView
    from .hacs_data import HACSData
    from .hacs_operator import HACSOperator
    from .backup import BackupManager
    from .dependency_checker import DependencyChecker

    # N3: Share a single HACSData instance across all components
    shared_data = HACSData(hass)
    operator = HACSOperator(hass, shared_data=shared_data)
    backup = BackupManager(hass, shared_data=shared_data)
    checker = DependencyChecker(hass, shared_data=shared_data)

    hass.http.register_view(HACSEnhancedStaticView(hass))
    hass.http.register_view(HACSEnhancedAPI(hass, data=shared_data, operator=operator, backup=backup, checker=checker))
    await _register_panel(hass)
    hass.data.setdefault(DOMAIN, {})["entry"] = entry

    # Register services
    _register_services(hass, operator)

    return True

async def _register_panel(hass: HomeAssistant) -> None:
    """Register the HACS Vision panel — embed_iframe=False so HA header/sidebar stays visible on mobile."""
    from homeassistant.components.frontend import async_register_built_in_panel
    from .const import VERSION
    try:
        from homeassistant.components import frontend
        frontend.async_remove_panel(hass, "hacs-vision")
        _LOGGER.debug("Removed existing hacs-vision panel before re-registration")
    except Exception:
        pass
    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path="hacs-vision",
        config={
            "_panel_custom": {
                "name": "hacs-vision-panel",
                "embed_iframe": False,
                "trust_external": False,
                "module": True,
                "js_url": f"/api/hacs_vision/static/panel.js?v={VERSION}",
            }
        },
        require_admin=True,
    )

def _register_services(hass: HomeAssistant, operator) -> None:
    """Register HA services for HACS Vision."""
    async def handle_refresh(call: ServiceCall) -> None:
        """Handle refresh service call."""
        if operator.available:
            try:
                await operator.refresh_repositories()
            except Exception as e:
                _LOGGER.error("Refresh service failed: %s", e, exc_info=True)

    async def handle_install_repository(call: ServiceCall) -> None:
        """Handle install_repository service call."""
        repo = call.data.get("repository", "")
        category = call.data.get("category", "integration")
        if not repo:
            _LOGGER.error("install_repository: 'repository' is required")
            return
        if operator.available:
            try:
                result = await operator.install_repository(repo, category)
                if not result.get("success"):
                    _LOGGER.error("Install service failed: %s", result.get("error", "unknown"))
            except Exception as e:
                _LOGGER.error("Install service error: %s", e, exc_info=True)

    hass.services.async_register(DOMAIN, "refresh", handle_refresh)
    hass.services.async_register(
        DOMAIN, "install_repository", handle_install_repository,
        schema=vol.Schema({
            vol.Required("repository"): cv.string,
            vol.Optional("category", default="integration"): cv.string,
        }),
    )


async def async_unload_entry(hass: HomeAssistant, entry: ConfigType) -> bool:
    """Unload HACS Vision."""
    from homeassistant.components import frontend
    try:
        frontend.async_remove_panel(hass, "hacs-vision")
    except Exception:
        pass

    # Remove all services
    hass.services.async_remove(DOMAIN, "refresh")
    hass.services.async_remove(DOMAIN, "install_repository")

    # Clean up data
    hass.data.pop(DOMAIN, None)
    return True
