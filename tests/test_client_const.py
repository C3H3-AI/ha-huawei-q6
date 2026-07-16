"""Tests for ``client/const.py`` (pure constants, no runtime dependencies)."""

import custom_components.huawei_router.client.const as const_mod
from custom_components.huawei_router.client.const import (
    CONNECTED_VIA_ID_PRIMARY,
    WIFI_SECURITY_ENCRYPTED,
    WIFI_SECURITY_OPEN,
)


def test_wifi_security_constants():
    assert WIFI_SECURITY_OPEN == "none"
    assert WIFI_SECURITY_ENCRYPTED == "tkip"


def test_connected_via_primary():
    assert CONNECTED_VIA_ID_PRIMARY == "primary"


def test_all_url_constants_are_well_formed():
    url_names = [n for n in dir(const_mod) if n.startswith("URL_")]
    assert url_names, "Expected at least one URL_* constant"
    for name in url_names:
        value = getattr(const_mod, name)
        assert isinstance(value, str), f"{name} must be a str"
        assert value, f"{name} must be non-empty"
        assert value.startswith("api/"), f"{name}={value!r} should start with 'api/'"


def test_specific_url_constant_values():
    assert const_mod.URL_DEVICE_INFO == "api/system/deviceinfo"
    assert const_mod.URL_WAN_INFO == "api/ntwk/wan?type=active"
    assert const_mod.URL_WLAN_FILTER == "api/ntwk/wlanfilterenhance"
