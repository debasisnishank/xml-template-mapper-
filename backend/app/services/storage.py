"""JSON-file persistence for templates.

Each template is stored as `<data_dir>/templates/<id>.json`. Suitable for the POC.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from ..config import settings
from ..models.template import (
    Template,
    TemplateCreate,
    TemplateSummary,
    TemplateUpdate,
)

_SAFE_ID = re.compile(r"^[A-Za-z0-9._-]+$")


def _templates_dir() -> Path:
    return settings.data_dir / "templates"


def _path_for(template_id: str) -> Path:
    if not _SAFE_ID.match(template_id):
        raise ValueError(f"Invalid template id: {template_id!r}")
    return _templates_dir() / f"{template_id}.json"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-").lower()
    return slug or "template"


def list_templates(country: Optional[str] = None) -> list[TemplateSummary]:
    out: list[TemplateSummary] = []
    for path in sorted(_templates_dir().glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            tpl = Template.model_validate(data)
        except Exception:
            continue
        if country and tpl.country.lower() != country.lower():
            continue
        out.append(
            TemplateSummary(
                id=tpl.id,
                name=tpl.name,
                country=tpl.country,
                description=tpl.description,
                version=tpl.version,
                updatedAt=tpl.updatedAt,
            )
        )
    out.sort(key=lambda t: t.updatedAt, reverse=True)
    return out


def get_template(template_id: str) -> Optional[Template]:
    path = _path_for(template_id)
    if not path.exists():
        return None
    return Template.model_validate(json.loads(path.read_text(encoding="utf-8")))


def create_template(payload: TemplateCreate) -> Template:
    now = _now()
    template_id = f"{_slugify(payload.country)}-{_slugify(payload.name)}-{uuid.uuid4().hex[:6]}"
    template = Template(
        id=template_id,
        createdAt=now,
        updatedAt=now,
        **payload.model_dump(),
    )
    _write(template)
    return template


def update_template(template_id: str, payload: TemplateUpdate) -> Optional[Template]:
    existing = get_template(template_id)
    if existing is None:
        return None
    data = existing.model_dump()
    for key, value in payload.model_dump(exclude_unset=True).items():
        data[key] = value
    data["updatedAt"] = _now()
    updated = Template.model_validate(data)
    _write(updated)
    return updated


def delete_template(template_id: str) -> bool:
    path = _path_for(template_id)
    if not path.exists():
        return False
    path.unlink()
    return True


def _write(template: Template) -> None:
    path = _path_for(template.id)
    path.write_text(
        template.model_dump_json(indent=2, by_alias=False),
        encoding="utf-8",
    )
