# XML Template Mapper — Frontend

React + Vite + TypeScript UI for the XML Template Mapper POC.

## Stack

- React 18 + React Router 6
- Vite 5
- TypeScript 5
- Zustand for editor state

## Setup

```bash
npm install
cp .env.example .env  # optional; defaults to http://localhost:8000
```

## Run

```bash
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
npm run preview
```

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Country + XML upload (entry point for create flow) |
| `/editor` | Three-panel mapping editor (XML tree • canvas • properties) |
| `/verify` | Pick country + saved template, upload new XML, see rendered output and issues. Export the rendered canvas as **PDF** or download the verification result as a **JSON report**. |

## Editor interactions

- **Left panel** lists the parsed XML as a tree. Drag a node onto the canvas to create a bound text element, or click a node while a canvas element is selected to bind it.
- **Center canvas** holds positioned elements (textbox / label / badge / table). Drag to move; click to select.
- **Right panel** edits the selected element's content, layout, and formatting. Tables expose a `repeatPath` plus a list of column paths relative to each row.

## Configuration

- `VITE_API_URL` — backend base URL (default `http://localhost:8000`).

## Notes

- The editor expects the backend to be running. Start `backend/` first, then `npm run dev` here.
- Templates are persisted server-side as JSON files. There is no client-side localStorage fallback in this build.
