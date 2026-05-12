"""
HA Remote - Unified Home Assistant remote connection tool.
Auto-detect LAN/WAN, wrap SSH, file upload, Supervisor API, REST API.

Usage:
    from ha_remote import HA

    ha = HA()
    print(ha.ssh("ls /config/custom_components/"))
    ha.upload_file("/local/path/file.py", "/config/custom_components/...")
    ha.restart_core()
    print(ha.get_entities("huawei_router"))
"""

import subprocess
import json
import os
import time
import base64
from typing import Any

import paramiko
import requests


class HA:
    SSH_KEY = os.path.expanduser(os.environ.get("HA_SSH_KEY", "~/.ssh/id_ha"))
    SSH_CIPHER = "aes256-gcm@openssh.com"
    SSH_USER = os.environ.get("HA_SSH_USER", "duola")
    SSH_PASS = os.environ.get("HA_SSH_PASS", "")
    LAN_HOST = os.environ.get("HA_LAN_HOST", os.environ.get("HA_SSH_HOST", ""))
    WAN_HOST = os.environ.get("HA_SSH_HOST", "")
    HA_PORT = os.environ.get("HA_SSH_PORT", "8123") if os.environ.get("HA_SSH_PORT", "").isdigit() else "8123"
    SSH_PORT_WAN = "22"
    SSH_PORT_LAN = "22"
    _HA_URL = os.environ.get("HA_URL") or os.environ.get("HOMEASSISTANT_URL", "")

    def __init__(self):
        self._host = None
        self._sup_token = None
        self._ssh_client = None

    def _ping(self, host: str, timeout: int = 3) -> bool:
        try:
            result = subprocess.run(
                ["ping", "-n", "1", "-w", str(timeout * 1000), host],
                capture_output=True, timeout=timeout + 2,
            )
            return result.returncode == 0
        except Exception:
            return False

    @property
    def host(self) -> str:
        if self._host:
            return self._host
        if self.LAN_HOST and self._ping(self.LAN_HOST):
            self._host = self.LAN_HOST
        else:
            self._host = self.WAN_HOST
        return self._host

    @property
    def ssh_port(self) -> str:
        return self.SSH_PORT_LAN if self.host == self.LAN_HOST else self.SSH_PORT_WAN

    @property
    def ha_url(self) -> str:
        if self._HA_URL:
            return self._HA_URL.rstrip("/")
        return f"http://{self.host}:{self.HA_PORT}"

    @property
    def ha_token(self) -> str:
        return os.environ.get("HOMEASSISTANT_TOKEN", "")

    def _get_ssh_client(self) -> paramiko.SSHClient:
        if self._ssh_client:
            return self._ssh_client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        connect_kwargs = {
            "hostname": self.host,
            "port": int(self.ssh_port),
            "username": self.SSH_USER,
            "timeout": 15,
        }
        # Try password first (from env), then key
        if self.SSH_PASS:
            connect_kwargs["password"] = self.SSH_PASS
        elif os.path.exists(self.SSH_KEY):
            key = paramiko.Ed25519Key.from_private_key_file(self.SSH_KEY)
            connect_kwargs["pkey"] = key
        client.connect(**connect_kwargs)
        self._ssh_client = client
        return client

    def _close_ssh(self):
        if self._ssh_client:
            try:
                self._ssh_client.close()
            except Exception:
                pass
            self._ssh_client = None

    def ssh(self, command: str, timeout: int = 30, sudo: bool = False) -> str:
        client = self._get_ssh_client()
        if sudo:
            command = f"sudo {command}"
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        exit_code = stdout.channel.recv_exit_status()
        if exit_code != 0 and err.strip():
            raise RuntimeError(f"SSH error (exit={exit_code}): {err.strip()[:500]}")
        return out.strip()

    def ssh_read_file(self, remote_path: str, sudo: bool = False) -> str:
        prefix = "sudo " if sudo else ""
        return self.ssh(f"{prefix}cat '{remote_path}'", timeout=15)

    def upload_file(self, local_path: str, remote_path: str, sudo: bool = False) -> bool:
        client = self._get_ssh_client()
        sftp = client.open_sftp()
        sftp.put(local_path, remote_path)
        sftp.close()
        return True

    def upload_dir(self, local_dir: str, remote_dir: str, sudo: bool = False, pattern: str = "*.py") -> list[str]:
        uploaded = []
        import glob as _glob
        for fpath in _glob.glob(os.path.join(local_dir, pattern)):
            fname = os.path.basename(fpath)
            remote_path = f"{remote_dir}/{fname}"
            self.upload_file(fpath, remote_path, sudo=sudo)
            uploaded.append(fname)
        return uploaded

    def restart_core(self) -> bool:
        try:
            self.ssh("ha core restart", timeout=10, sudo=True)
            return True
        except Exception:
            pass
        return False

    def _ha_request(self, path: str, method: str = "GET", **kwargs) -> dict | list:
        url = f"{self.ha_url}/api/{path}"
        token = kwargs.pop("token", None) or self.ha_token
        headers = {"Authorization": f"Bearer {token}"}
        headers.update(kwargs.pop("headers", {}))
        resp = requests.request(method, url, headers=headers, timeout=15, **kwargs)
        resp.raise_for_status()
        if resp.status_code == 204:
            return {}
        return resp.json()

    def get_entities(self, domain_filter: str = "") -> list[dict]:
        entities = self._ha_request("states")
        if domain_filter:
            return [e for e in entities if domain_filter in e["entity_id"]]
        return entities

    def get_entity(self, entity_id: str) -> dict:
        return self._ha_request(f"states/{entity_id}")

    def check_integration(self, domain: str) -> dict:
        result = {"domain": domain, "entities": [], "config": None}
        entities = self.get_entities(domain)
        result["entities"] = [
            {"entity_id": e["entity_id"], "state": e["state"]} for e in entities
        ]
        content = self.ssh_read_file("/config/.storage/core.config_entries", sudo=True)
        if content:
            data = json.loads(content)
            for entry in data["data"]["entries"]:
                if entry.get("domain") == domain:
                    result["config"] = {
                        k: v for k, v in entry.get("data", {}).items()
                        if k not in ("token", "refresh_token")
                    }
                    result["entry_id"] = entry.get("entry_id")
                    break
        return result

    def info(self) -> str:
        lines = [
            f"Host: {self.host} ({'LAN' if self.host == self.LAN_HOST else 'WAN'})",
            f"SSH Port: {self.ssh_port}",
            f"HA URL: {self.ha_url}",
        ]
        return "\n".join(lines)


_ha_instance: HA | None = None


def get_ha() -> HA:
    global _ha_instance
    if _ha_instance is None:
        _ha_instance = HA()
    return _ha_instance


if __name__ == "__main__":
    ha = HA()
    print(ha.info())
