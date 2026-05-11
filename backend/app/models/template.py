from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


ElementType = Literal["textbox", "label", "badge", "table"]
ValueMode = Literal["dynamic", "static"]


class Format(BaseModel):
    font: Optional[str] = None
    fontSize: Optional[int] = None
    fontWeight: Optional[str] = None
    color: Optional[str] = None
    align: Optional[Literal["left", "center", "right"]] = None
    dateFormat: Optional[str] = None
    numberFormat: Optional[str] = None
    visible: bool = True


class TableColumn(BaseModel):
    id: str
    label: str
    xmlPath: str
    width: Optional[int] = None


class Element(BaseModel):
    id: str
    type: ElementType
    label: str = ""
    xmlPath: Optional[str] = None
    staticValue: Optional[str] = None
    mode: ValueMode = "dynamic"
    x: float = 0
    y: float = 0
    width: float = 160
    height: float = 32
    format: Format = Field(default_factory=Format)
    # Table/repeating section metadata
    repeatPath: Optional[str] = None
    columns: Optional[list[TableColumn]] = None


class CanvasMeta(BaseModel):
    width: int = 1200
    height: int = 800
    background: Optional[str] = "#ffffff"


class TemplateBase(BaseModel):
    name: str
    country: str
    description: Optional[str] = None
    version: Optional[str] = "1"
    canvas: CanvasMeta = Field(default_factory=CanvasMeta)
    elements: list[Element] = Field(default_factory=list)


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    canvas: Optional[CanvasMeta] = None
    elements: Optional[list[Element]] = None


class Template(TemplateBase):
    id: str
    createdAt: datetime
    updatedAt: datetime


class TemplateSummary(BaseModel):
    id: str
    name: str
    country: str
    description: Optional[str] = None
    version: Optional[str] = None
    updatedAt: datetime


# XML parsing models

class XmlNode(BaseModel):
    name: str
    path: str
    attributes: dict[str, str] = Field(default_factory=dict)
    value: Optional[str] = None
    children: list["XmlNode"] = Field(default_factory=list)
    isRepeating: bool = False
    namespace: Optional[str] = None


XmlNode.model_rebuild()


class ParsedXml(BaseModel):
    root: XmlNode
    namespaces: dict[str, str] = Field(default_factory=dict)


# Verification models

class FieldIssue(BaseModel):
    elementId: str
    label: str
    xmlPath: Optional[str] = None
    severity: Literal["missing", "empty", "error", "info"]
    message: str


class FieldValue(BaseModel):
    elementId: str
    label: str
    xmlPath: Optional[str] = None
    value: Optional[Any] = None
    rows: Optional[list[dict[str, Any]]] = None  # for table elements


class VerificationResult(BaseModel):
    templateId: str
    templateName: str
    country: str
    values: list[FieldValue]
    issues: list[FieldIssue]
    okCount: int
    issueCount: int
