"""Tests for ``client/crypto.py``.

These exercise the RSA chunked-encode path that the audit flagged (P1: chunk
length mismatch handling). A real round-trip (encrypt with the public key,
decrypt with the private key) proves the chunking logic preserves data.
"""

import base64
import math

import pytest
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA

from custom_components.huawei_router.client.classes import HuaweiRsaPublicKey
from custom_components.huawei_router.client.crypto import (
    CryptographyError,
    generate_nonce,
    get_client_proof,
    rsa_encode,
)


def test_generate_nonce_format():
    nonce = generate_nonce()
    assert isinstance(nonce, str)
    assert len(nonce) == 64  # 32 bytes -> 64 hex chars
    int(nonce, 16)  # must be valid hex


def test_get_client_proof_deterministic_and_distinct():
    a = get_client_proof("pw", "deadbeef", 1000, "n1", "n2")
    b = get_client_proof("pw", "deadbeef", 1000, "n1", "n2")
    assert a == b
    assert isinstance(a, str)
    c = get_client_proof("other", "deadbeef", 1000, "n1", "n2")
    assert c != a


def _make_key_and_pub():
    key = RSA.generate(2048)
    n_hex = key.n.to_bytes(256, "big").hex()
    e_hex = format(key.e, "x")
    pub = HuaweiRsaPublicKey(rsan=n_hex, rsae=e_hex, signature="")
    return key, pub, n_hex


def _rsa_decode(encoded, rsan, private_key):
    cipher = PKCS1_OAEP.new(private_key)
    chunk_len = len(rsan)
    out = b""
    for i in range(0, len(encoded), chunk_len):
        ct = bytes.fromhex(encoded[i : i + chunk_len])
        out += cipher.decrypt(ct)
    return base64.b64decode(out).decode("utf-8")


def test_rsa_encode_roundtrip_single_chunk():
    key, pub, rsan = _make_key_and_pub()
    plaintext = "admin:Secret123!"
    encoded = rsa_encode(plaintext, pub)
    assert _rsa_decode(encoded, rsan, key) == plaintext


def test_rsa_encode_roundtrip_multi_chunk():
    key, pub, rsan = _make_key_and_pub()
    plaintext = "router-config-payload-" * 40  # forces > 1 chunk
    encoded = rsa_encode(plaintext, pub)
    assert _rsa_decode(encoded, rsan, key) == plaintext


def test_rsa_encode_chunk_count_matches():
    key, pub, rsan = _make_key_and_pub()
    plaintext = "x" * 500
    encoded = rsa_encode(plaintext, pub)
    expected_chunks = math.ceil(len(base64.b64encode(plaintext.encode())) / 214)
    assert len(encoded) == expected_chunks * len(rsan)


def test_rsa_encode_mismatched_key_length_raises():
    # Take a real modulus and pad its *string* form with leading zeros so the
    # rsan length no longer equals the encrypted-chunk length. The encoder must
    # raise (fail-fast) and never silently drop a chunk (old `continue` path).
    key = RSA.generate(2048)
    n_hex = key.n.to_bytes(256, "big").hex()
    bad = HuaweiRsaPublicKey(rsan="00" + n_hex, rsae="10001", signature="")
    with pytest.raises(CryptographyError):
        rsa_encode("hello world", bad)
