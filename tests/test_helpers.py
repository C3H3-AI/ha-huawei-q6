"""Tests for ``helpers.py`` (P1: None-guard in entity unique id generation)."""

from types import SimpleNamespace

from custom_components.huawei_router.helpers import generate_entity_unique_id


def test_generate_entity_unique_id_with_mac():
    coord = SimpleNamespace(
        unique_id="RTR",
        get_router_info=lambda: SimpleNamespace(serial_number="SN123"),
    )
    # prefix (unique_id) is used verbatim; only the suffix is lower-cased.
    assert generate_entity_unique_id(coord, "switch", "AA:BB") == "RTR_switch_aa:bb"


def test_generate_entity_unique_id_falls_back_when_router_info_none():
    coord = SimpleNamespace(unique_id="RTR", get_router_info=lambda: None)
    # Must not raise AttributeError; falls back to a stable placeholder.
    assert generate_entity_unique_id(coord, "switch") == "RTR_switch_unknown"
