# XML Template Mapper — Backend

FastAPI service that parses uploaded XML, persists country-specific mapping templates as JSON files, and verifies new XML against saved templates.

## Stack

- Python 3.10+
- FastAPI + Uvicorn
- Pydantic v2 for models
- `defusedxml` for safe XML parsing
- JSON-on-disk persistence (`./data/templates/*.json`)

## Setup

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # optional
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Tests

```bash
pytest
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness check |
| GET | `/api/countries` | Seeded country list |
| GET | `/api/templates?country=Belgium` | List templates (optional country filter) |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/{id}` | Get full template |
| PUT | `/api/templates/{id}` | Update template |
| DELETE | `/api/templates/{id}` | Delete template |
| POST | `/api/xml/parse` | Multipart upload `file` → parsed tree |
| POST | `/api/verify` | Multipart `template_id` + `file` → verification result |

## Template JSON shape

See `app/models/template.py`. A minimal example:

```json
{
  "id": "belgium-invoice-abcd12",
  "name": "Belgium Invoice",
  "country": "Belgium",
  "canvas": { "width": 1200, "height": 800 },
  "elements": [
    {
      "id": "invoice-number",
      "type": "textbox",
      "label": "Invoice Number",
      "xmlPath": "/Invoice/Header/InvoiceNo",
      "mode": "dynamic",
      "x": 40, "y": 40, "width": 200, "height": 32,
      "format": { "fontSize": 14, "align": "left", "visible": true }
    }
  ]
}
```

Tables (repeating sections) use `repeatPath` plus a list of `columns` with paths relative to each row.

## Configuration

- `CORS_ORIGINS` — comma-separated allowed origins (default `http://localhost:5173`)
- `DATA_DIR` — folder for JSON template files (default `./data`)
