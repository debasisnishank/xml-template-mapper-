"""Apply a saved template's bindings to a parsed XML document."""

from __future__ import annotations

from typing import Any

from ..models.template import (
    Element,
    FieldIssue,
    FieldValue,
    ParsedXml,
    Template,
    VerificationResult,
)
from .xml_service import resolve_repeating, resolve_row_value, resolve_value


def verify(template: Template, parsed: ParsedXml) -> VerificationResult:
    values: list[FieldValue] = []
    issues: list[FieldIssue] = []

    for element in template.elements:
        if element.type == "table":
            _handle_table(element, parsed, values, issues)
        else:
            _handle_field(element, parsed, values, issues)

    ok_count = sum(
        1
        for v in values
        if (v.value is not None and v.value != "") or (v.rows is not None and len(v.rows) > 0)
    )

    return VerificationResult(
        templateId=template.id,
        templateName=template.name,
        country=template.country,
        values=values,
        issues=issues,
        okCount=ok_count,
        issueCount=len(issues),
    )


def _handle_field(
    element: Element,
    parsed: ParsedXml,
    values: list[FieldValue],
    issues: list[FieldIssue],
) -> None:
    if element.mode == "static":
        values.append(
            FieldValue(
                elementId=element.id,
                label=element.label,
                xmlPath=None,
                value=element.staticValue,
            )
        )
        return

    if not element.xmlPath:
        issues.append(
            FieldIssue(
                elementId=element.id,
                label=element.label,
                xmlPath=None,
                severity="error",
                message="Dynamic element has no XML path bound",
            )
        )
        values.append(FieldValue(elementId=element.id, label=element.label, value=None))
        return

    value = resolve_value(parsed, element.xmlPath)
    values.append(
        FieldValue(
            elementId=element.id,
            label=element.label,
            xmlPath=element.xmlPath,
            value=value,
        )
    )
    if value is None:
        issues.append(
            FieldIssue(
                elementId=element.id,
                label=element.label,
                xmlPath=element.xmlPath,
                severity="missing",
                message=f"XML node not found at path '{element.xmlPath}'",
            )
        )
    elif value == "":
        issues.append(
            FieldIssue(
                elementId=element.id,
                label=element.label,
                xmlPath=element.xmlPath,
                severity="empty",
                message=f"XML node at '{element.xmlPath}' is empty",
            )
        )


def _handle_table(
    element: Element,
    parsed: ParsedXml,
    values: list[FieldValue],
    issues: list[FieldIssue],
) -> None:
    if not element.repeatPath:
        issues.append(
            FieldIssue(
                elementId=element.id,
                label=element.label,
                severity="error",
                message="Table element has no repeatPath",
            )
        )
        values.append(FieldValue(elementId=element.id, label=element.label, rows=[]))
        return

    rows_nodes = resolve_repeating(parsed, element.repeatPath)
    if not rows_nodes:
        issues.append(
            FieldIssue(
                elementId=element.id,
                label=element.label,
                xmlPath=element.repeatPath,
                severity="missing",
                message=f"No repeating nodes found at '{element.repeatPath}'",
            )
        )
        values.append(FieldValue(elementId=element.id, label=element.label, rows=[]))
        return

    columns = element.columns or []
    rendered: list[dict[str, Any]] = []
    for row in rows_nodes:
        row_dict: dict[str, Any] = {}
        for col in columns:
            cell = resolve_row_value(row, col.xmlPath)
            row_dict[col.id] = cell
            if cell is None:
                issues.append(
                    FieldIssue(
                        elementId=element.id,
                        label=f"{element.label} / {col.label}",
                        xmlPath=f"{element.repeatPath}/{col.xmlPath}",
                        severity="missing",
                        message=f"Row missing value for '{col.label}'",
                    )
                )
        rendered.append(row_dict)

    values.append(
        FieldValue(
            elementId=element.id,
            label=element.label,
            xmlPath=element.repeatPath,
            rows=rendered,
        )
    )
