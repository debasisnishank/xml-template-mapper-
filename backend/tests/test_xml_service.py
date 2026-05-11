from app.services.xml_service import parse_xml, resolve_repeating, resolve_value


SAMPLE_XML = b"""<?xml version='1.0' encoding='UTF-8'?>
<Invoice>
  <Header>
    <InvoiceNo>INV-001</InvoiceNo>
    <IssueDate>2026-05-01</IssueDate>
  </Header>
  <Lines>
    <Line>
      <Description>Widget</Description>
      <Quantity>2</Quantity>
      <Price>10.00</Price>
    </Line>
    <Line>
      <Description>Gadget</Description>
      <Quantity>1</Quantity>
      <Price>25.00</Price>
    </Line>
  </Lines>
</Invoice>
"""


def test_parse_builds_tree():
    parsed = parse_xml(SAMPLE_XML)
    assert parsed.root.name == "Invoice"
    header = next(c for c in parsed.root.children if c.name == "Header")
    invoice_no = next(c for c in header.children if c.name == "InvoiceNo")
    assert invoice_no.value == "INV-001"


def test_resolve_value_with_leading_slash():
    parsed = parse_xml(SAMPLE_XML)
    assert resolve_value(parsed, "/Invoice/Header/InvoiceNo") == "INV-001"


def test_resolve_value_without_leading_slash():
    parsed = parse_xml(SAMPLE_XML)
    assert resolve_value(parsed, "Invoice/Header/IssueDate") == "2026-05-01"


def test_resolve_repeating_returns_all_lines():
    parsed = parse_xml(SAMPLE_XML)
    rows = resolve_repeating(parsed, "/Invoice/Lines/Line")
    assert len(rows) == 2
    assert rows[0].children[0].value == "Widget"


def test_invalid_xml_raises():
    import pytest

    with pytest.raises(ValueError):
        parse_xml(b"<not-valid")
