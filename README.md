# XML Template Mapper — POC

Web tool that lets users upload country-specific XML files, visually map XML fields onto a canvas, save those mappings as reusable templates, and apply saved templates to new XML files for verification. See [`REQUIREMENTS.md`](./REQUIREMENTS.md) for the full spec.

## Repo layout

```
sandy_poc/
├── backend/     # Python + FastAPI API; JSON file storage
├── frontend/    # React + Vite + TypeScript UI
├── REQUIREMENTS.md
└── ...source PDFs / sample XML
```

Each subproject has its own README with setup instructions.

## Quick start

In two terminals:

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv

# Windows (cmd):         .venv\Scripts\activate.bat
# Windows (PowerShell):  .\.venv\Scripts\Activate.ps1
# macOS/Linux:           source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173.

## Flow

1. Pick a country and upload an XML file on the home screen.
2. The Editor parses the XML and shows it as a draggable tree on the left. Drag fields onto the canvas, position elements, edit properties on the right, and **Save Template**.
3. Switch to **Verify**, pick the same country + saved template, upload a new XML file, and the rendered preview highlights missing or empty fields.

## Persistence

Templates are stored as JSON files under `backend/data/templates/`. Easy to inspect, easy to seed.
