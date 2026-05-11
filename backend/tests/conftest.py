import os
import tempfile

import pytest


@pytest.fixture(autouse=True)
def isolated_data_dir(monkeypatch: pytest.MonkeyPatch):
    """Point each test at a fresh on-disk data directory."""
    with tempfile.TemporaryDirectory() as tmp:
        monkeypatch.setenv("DATA_DIR", tmp)
        # Reload settings/storage modules to pick up new env.
        from importlib import reload

        from app import config as config_module

        reload(config_module)
        from app.services import storage as storage_module

        reload(storage_module)
        from app.routers import templates as templates_router
        from app.routers import verify as verify_router

        reload(templates_router)
        reload(verify_router)
        yield tmp
