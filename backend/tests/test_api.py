import io

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


SAMPLE_XML = b"""<?xml version='1.0' encoding='UTF-8'?>
<Invoice>
  <Header><InvoiceNo>INV-9</InvoiceNo></Header>
  <Lines>
    <Line><Description>A</Description><Price>1.00</Price></Line>
    <Line><Description>B</Description><Price>2.00</Price></Line>
  </Lines>
</Invoice>
"""


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_countries_seeded():
    res = client.get("/api/countries")
    assert res.status_code == 200
    assert any(c["code"] == "BE" for c in res.json())


def test_template_crud_and_verify():
    create_payload = {
        "name": "BE Invoice",
        "country": "Belgium",
        "canvas": {"width": 1200, "height": 800},
        "elements": [
            {
                "id": "invoice-no",
                "type": "textbox",
                "label": "Invoice Number",
                "xmlPath": "/Invoice/Header/InvoiceNo",
                "mode": "dynamic",
                "x": 40,
                "y": 40,
                "width": 200,
                "height": 32,
                "format": {},
            },
            {
                "id": "lines",
                "type": "table",
                "label": "Lines",
                "mode": "dynamic",
                "x": 40,
                "y": 100,
                "width": 600,
                "height": 200,
                "repeatPath": "/Invoice/Lines/Line",
                "columns": [
                    {"id": "desc", "label": "Description", "xmlPath": "Description"},
                    {"id": "price", "label": "Price", "xmlPath": "Price"},
                ],
                "format": {},
            },
        ],
    }

    create = client.post("/api/templates", json=create_payload)
    assert create.status_code == 201, create.text
    template = create.json()
    template_id = template["id"]

    listed = client.get("/api/templates").json()
    assert any(t["id"] == template_id for t in listed)

    res = client.post(
        "/api/verify",
        data={"template_id": template_id},
        files={"file": ("invoice.xml", io.BytesIO(SAMPLE_XML), "application/xml")},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["templateId"] == template_id
    values_by_id = {v["elementId"]: v for v in body["values"]}
    assert values_by_id["invoice-no"]["value"] == "INV-9"
    assert len(values_by_id["lines"]["rows"]) == 2

    delete = client.delete(f"/api/templates/{template_id}")
    assert delete.status_code == 204


def test_parse_endpoint_rejects_non_xml_extension():
    res = client.post(
        "/api/xml/parse",
        files={"file": ("invoice.txt", io.BytesIO(SAMPLE_XML), "application/xml")},
    )
    assert res.status_code == 400
