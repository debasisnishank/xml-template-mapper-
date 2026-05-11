from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from ..models.template import (
    Template,
    TemplateCreate,
    TemplateSummary,
    TemplateUpdate,
)
from ..services import storage

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=list[TemplateSummary])
def list_templates(country: Optional[str] = Query(default=None)) -> list[TemplateSummary]:
    return storage.list_templates(country=country)


@router.get("/{template_id}", response_model=Template)
def get_template(template_id: str) -> Template:
    template = storage.get_template(template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("", response_model=Template, status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreate) -> Template:
    return storage.create_template(payload)


@router.put("/{template_id}", response_model=Template)
def update_template(template_id: str, payload: TemplateUpdate) -> Template:
    template = storage.update_template(template_id, payload)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: str) -> None:
    if not storage.delete_template(template_id):
        raise HTTPException(status_code=404, detail="Template not found")
