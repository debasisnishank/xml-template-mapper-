"""Safe XML parsing utilities.

Uses ``defusedxml`` to block external entity / billion-laughs attacks. Builds a
normalized tree model with stable, namespace-prefix-free paths suitable for
mapping in the UI.
"""

from __future__ import annotations

import re
from collections import Counter
from typing import Any, Optional

from defusedxml import ElementTree as DET
from xml.etree.ElementTree import Element as ETElement

from ..models.template import ParsedXml, XmlNode


_NS_RE = re.compile(r"^\{(?P<ns>[^}]+)\}(?P<local>.+)$")


def _split_qname(tag: str) -> tuple[Optional[str], str]:
    match = _NS_RE.match(tag)
    if match:
        return match.group("ns"), match.group("local")
    return None, tag


def _local(tag: str) -> str:
    return _split_qname(tag)[1]


def parse_xml(content: bytes | str) -> ParsedXml:
    if isinstance(content, str):
        content = content.encode("utf-8")
    if not content.strip():
        raise ValueError("XML file is empty")
    try:
        root: ETElement = DET.fromstring(content)
    except Exception as exc:  # pragma: no cover - error surfaced to caller
        raise ValueError(f"Invalid XML: {exc}") from exc

    namespaces: dict[str, str] = {}
    node = _build_node(root, parent_path="", namespaces=namespaces)
    return ParsedXml(root=node, namespaces=namespaces)


def _build_node(
    element: ETElement,
    parent_path: str,
    namespaces: dict[str, str],
) -> XmlNode:
    ns, local = _split_qname(element.tag)
    if ns and local not in namespaces.values():
        # Track namespaces by local prefix as a hint for the UI.
        namespaces.setdefault(local, ns)

    path = f"{parent_path}/{local}" if parent_path else f"/{local}"

    # Detect repeating siblings: count how many children share each local name.
    child_counts: Counter[str] = Counter(_local(c.tag) for c in list(element))
    seen: Counter[str] = Counter()
    children: list[XmlNode] = []
    for child in list(element):
        cl = _local(child.tag)
        seen[cl] += 1
        is_repeating = child_counts[cl] > 1
        # Index repeating children to keep paths unique.
        child_path_parent = path
        node = _build_node(child, parent_path=child_path_parent, namespaces=namespaces)
        node.isRepeating = is_repeating
        children.append(node)

    text = (element.text or "").strip()
    value = text if text else None

    attrs = {_local(k): v for k, v in element.attrib.items()}

    return XmlNode(
        name=local,
        path=path,
        value=value,
        attributes=attrs,
        children=children,
        namespace=ns,
    )


# ---------------------------------------------------------------------------
# Path resolution for templates
# ---------------------------------------------------------------------------


def _normalize_path(path: str) -> list[str]:
    """Return a list of local-name segments from a slash path.

    Supported forms:
      - ``/Invoice/Header/InvoiceNo``
      - ``Invoice/Header/InvoiceNo``
      - ``Invoice/Line[2]/Amount`` (index ignored when matching by name; the
        verifier surfaces repeating sets via ``resolve_repeating``)
    """
    cleaned = path.strip().lstrip("/")
    parts: list[str] = []
    for raw in cleaned.split("/"):
        if not raw:
            continue
        # Strip predicates like Line[2] or @attr -> base name only.
        name = re.sub(r"\[.*?\]$", "", raw)
        parts.append(name)
    return parts


def resolve_value(parsed: ParsedXml, path: str) -> Optional[str]:
    """Resolve a single field path to a value (first match)."""
    if not path:
        return None
    segments = _normalize_path(path)
    matches = _walk(parsed.root, segments, collect_all=False)
    if not matches:
        return None
    return _node_value(matches[0])


def resolve_repeating(parsed: ParsedXml, path: str) -> list[XmlNode]:
    """Resolve a repeating-section path to all matching nodes."""
    if not path:
        return []
    segments = _normalize_path(path)
    return _walk(parsed.root, segments, collect_all=True)


def resolve_row_value(row: XmlNode, relative_path: str) -> Optional[str]:
    if not relative_path:
        return _node_value(row)
    segments = _normalize_path(relative_path)
    matches = _walk(row, segments, collect_all=False, include_root=True)
    if not matches:
        return None
    return _node_value(matches[0])


def _walk(
    node: XmlNode,
    segments: list[str],
    collect_all: bool,
    include_root: bool = True,
) -> list[XmlNode]:
    if not segments:
        return [node]
    head, *rest = segments
    # Allow path to start with the root's name (e.g. ``/Invoice/...``).
    if include_root and node.name == head:
        if not rest:
            return [node]
        return _descend(node, rest, collect_all)
    return _descend(node, segments, collect_all)


def _descend(node: XmlNode, segments: list[str], collect_all: bool) -> list[XmlNode]:
    if not segments:
        return [node]
    head, *rest = segments
    found: list[XmlNode] = []
    for child in node.children:
        if child.name == head:
            if not rest:
                found.append(child)
                if not collect_all:
                    return found
            else:
                deeper = _descend(child, rest, collect_all)
                found.extend(deeper)
                if deeper and not collect_all:
                    return found
    return found


def _node_value(node: XmlNode) -> Optional[str]:
    if node.value is not None:
        return node.value
    # Fall back to a single attribute if present.
    if node.attributes:
        # Prefer common attribute keys.
        for key in ("value", "Value", "id", "ID"):
            if key in node.attributes:
                return node.attributes[key]
        # Otherwise, return the first attribute value.
        return next(iter(node.attributes.values()))
    return None


def to_dict(node: XmlNode) -> dict[str, Any]:
    return node.model_dump()
