"""Tests for ``client/classes.py`` (dataclasses, enums, pure helpers)."""

import pytest

from custom_components.huawei_router.client.classes import (
    Action,
    DayOfWeek,
    Feature,
    FilterAction,
    FilterMode,
    Frequency,
    HuaweiClientDevice,
    HuaweiDeviceNode,
    HuaweiFilterInfo,
    HuaweiPortMappingItem,
    HuaweiRsaPublicKey,
    Switch,
    is_huawei_device,
)


# ---------------------------
# is_huawei_device
# ---------------------------

def test_is_huawei_device_known_prefix():
    assert is_huawei_device("00:25:9e:aa:bb:cc") is True


def test_is_huawei_device_case_insensitive_and_dash():
    # dash-separated + upper case still resolves to a known OUI prefix
    assert is_huawei_device("00-25-9E-AA-BB-CC") is True


def test_is_huawei_device_non_huawei():
    assert is_huawei_device("aa:bb:cc:dd:ee:ff") is False


def test_is_huawei_device_none_and_empty():
    assert is_huawei_device(None) is False
    assert is_huawei_device("") is False


# ---------------------------
# Enums
# ---------------------------

def test_feature_enum_values():
    assert Feature.NFC.value == "feature_nfc"
    assert Feature.WIFI_80211R.value == "feature_wifi_80211r"
    assert Feature.TIME_CONTROL.value == "feature_time_control"
    assert Feature.GUEST_NETWORK.value == "feature_guest_network"


def test_switch_and_action_enums():
    assert Switch.NFC.value == "nfc_switch"
    assert Action.REBOOT.value == "reboot_action"


def test_frequency_and_filter_enums():
    assert Frequency.WIFI_2_4_GHZ.value == "2.4GHz"
    assert Frequency.WIFI_5_GHZ.value == "5GHz"
    assert FilterAction.ADD.value == 0
    assert FilterAction.REMOVE.value == 1
    assert FilterMode.BLACKLIST.value == 0
    assert FilterMode.WHITELIST.value == 1


def test_day_of_week_enum():
    assert {d.value for d in DayOfWeek} == {
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
    }


# ---------------------------
# Dataclasses
# ---------------------------

def test_huawei_rsa_public_key_dataclass():
    key = HuaweiRsaPublicKey(rsan="abcd", rsae="10001", signature="sig")
    assert key.rsan == "abcd"
    assert key.rsae == "10001"
    assert key.signature == "sig"


# ---------------------------
# HuaweiPortMappingItem
# ---------------------------

def _port_mapping_raw(item_id="1"):
    return {
        "ID": item_id,
        "Name": "Rule1",
        "Enable": True,
        "HostIPAddress": "192.168.1.10",
        "InternalHost": "aa:bb:cc:dd:ee:ff",
        "HostName": "MyPC",
        "ApplicationID": "app1",
    }


def test_port_mapping_parse_valid():
    item = HuaweiPortMappingItem.parse(_port_mapping_raw())
    assert item.id == "1"
    assert item.name == "Rule1"
    assert item.enabled is True
    assert item.host_ip == "192.168.1.10"
    assert item.host_mac == "aa:bb:cc:dd:ee:ff"
    assert item.host_name == "MyPC"


def test_port_mapping_parse_empty_id_raises():
    with pytest.raises(ValueError):
        HuaweiPortMappingItem.parse({"Name": "x"})


# ---------------------------
# HuaweiFilterInfo
# ---------------------------

def _filter_raw(policy):
    return {
        "MACAddressControlEnabled": True,
        "MacFilterPolicy": policy,
        "WMACAddresses": [{"HostName": "Alice", "MACAddress": "aa:bb:cc:dd:ee:ff"}],
        "BMACAddresses": [],
    }


def test_filter_info_blacklist():
    info = HuaweiFilterInfo.parse(_filter_raw(0))
    assert info.enabled is True
    assert info.mode == FilterMode.BLACKLIST
    assert len(info.whitelist) == 1


def test_filter_info_whitelist():
    info = HuaweiFilterInfo.parse(_filter_raw(1))
    assert info.mode == FilterMode.WHITELIST


def test_filter_info_invalid_policy_raises():
    with pytest.raises(ValueError):
        HuaweiFilterInfo.parse(_filter_raw(2))


# ---------------------------
# HuaweiClientDevice
# ---------------------------

def test_client_device_router_detection():
    dev = HuaweiClientDevice({
        "MACAddress": "aa:bb:cc:dd:ee:ff",
        "Active": True,
        "HiLinkDevice": True,
        "ActualName": "Huawei Q6",
        "HostName": "",
        "IPAddress": "192.168.1.5",
        "rssi": -50,
        "UpRate": 100,
        "DownRate": 200,
        "UpTime": 3600,
    })
    assert dev.mac_address == "aa:bb:cc:dd:ee:ff"
    assert dev.is_active is True
    assert dev.is_hilink is True
    assert dev.is_router is True  # "q6" matched by router pattern
    assert dev.ip_address == "192.168.1.5"
    assert dev.rssi == -50
    assert dev.upload_rate == 100
    assert dev.download_rate == 200
    assert dev.uptime == 3600


def test_client_device_phone_is_not_router():
    dev = HuaweiClientDevice({
        "MACAddress": "aa:bb:cc:dd:ee:ff",
        "Active": True,
        "ActualName": "iPhone 13",
        "HostName": "",
    })
    assert dev.is_router is False
    assert dev.is_hilink is False


def test_client_device_guest():
    dev = HuaweiClientDevice({"MACAddress": "aa:bb:cc:dd:ee:ff", "IsGuest": True})
    assert dev.is_guest is True


# ---------------------------
# HuaweiDeviceNode
# ---------------------------

def test_device_node_connected_devices():
    parent = HuaweiDeviceNode("aa:bb:cc:dd:ee:ff", "Device")
    child = HuaweiDeviceNode("11:22:33:44:55:66", "Device")
    parent.add_device(child)
    assert list(parent.connected_devices) == [child]
    assert parent.mac_address == "aa:bb:cc:dd:ee:ff"
