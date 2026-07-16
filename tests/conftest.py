"""Pytest configuration for the huawei_router integration.

Offline import shim
-------------------
The integration's package ``__init__``
(``custom_components/huawei_router/__init__.py``) imports ``homeassistant``,
which is **not** installed in this test environment. The ``client`` subpackage
(API / crypto layer) is fully decoupled from HA and only depends on
``aiohttp`` / ``yarl`` / ``Crypto`` / ``voluptuous`` (all available).

To unit-test the ``client`` layer without pulling in the HA-dependent
``__init__``, we register ``custom_components`` and
``custom_components.huawei_router`` as *synthetic namespace packages* that point
at their real directories. This lets ``client.*`` resolve from disk **without**
executing ``huawei_router/__init__.py``.
"""

import os
import sys
import types

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class _HAMeta(type):
    """Metaclass so the stub *class* itself also resolves nested attributes."""
    def __getattr__(cls, name):
        return _HAStub


class _HAStub(types.ModuleType, metaclass=_HAMeta):
    """Offline stub for ``homeassistant`` / ``requests`` (not installed here).

    A *registered instance* acts as the module (submodule imports resolve via
    the finder). Attribute access -- on instances *and* on the class -- yields
    the stub class itself, which HA-coupled code subclasses / instantiates.
    """
    def __getattr__(self, name):
        return _HAStub

    def __init__(self, *args, **kwargs):
        pass


class _HAFinder:
    """Meta-path finder that synthesizes stubs for uninstalled top packages."""

    def find_spec(self, name, path=None, target=None):
        if name.split(".")[0] in {"homeassistant", "requests"}:
            if name not in sys.modules:
                sys.modules[name] = _HAStub()
            from importlib.machinery import ModuleSpec
            from importlib.abc import Loader

            class _StubLoader(Loader):
                def create_module(self, spec):
                    return sys.modules.get(spec.name) or _HAStub()

                def exec_module(self, m):
                    pass

            return ModuleSpec(name, _StubLoader())
        return None


sys.meta_path.insert(0, _HAFinder())


def _register_namespace(name: str, path: str) -> None:
    """Register a package-like module in sys.modules so submodules resolve."""
    if name not in sys.modules:
        mod = types.ModuleType(name)
        mod.__path__ = [path  # marks it as a package; submodules resolve from disk
                        for path in (path,)]
        sys.modules[name] = mod


_register_namespace("custom_components", os.path.join(_ROOT, "custom_components"))
_register_namespace(
    "custom_components.huawei_router",
    os.path.join(_ROOT, "custom_components", "huawei_router"),
)

if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)
