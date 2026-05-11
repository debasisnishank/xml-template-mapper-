import { useEditor } from "../store/editorStore";
import type { CanvasElement, TableColumn } from "../types/template";

export function PropertiesPanel() {
  const { elements, selectedId, updateElement, removeElement } = useEditor();
  const element = elements.find((e) => e.id === selectedId) ?? null;

  if (!element) {
    return (
      <div className="properties empty">
        <p className="muted">Select an element on the canvas to edit its properties.</p>
      </div>
    );
  }

  const patch = (p: Partial<CanvasElement>) => updateElement(element.id, p);
  const patchFormat = (p: Partial<CanvasElement["format"]>) =>
    patch({ format: { ...element.format, ...p } });

  return (
    <div className="properties">
      <div className="prop-header">
        <span className="prop-type">{element.type}</span>
        <button className="danger" onClick={() => removeElement(element.id)}>
          Delete
        </button>
      </div>

      <Section title="Content">
        <Field label="Label">
          <input
            value={element.label}
            onChange={(e) => patch({ label: e.target.value })}
          />
        </Field>
        <Field label="Mode">
          <select
            value={element.mode}
            onChange={(e) => patch({ mode: e.target.value as "static" | "dynamic" })}
          >
            <option value="dynamic">Dynamic (XML)</option>
            <option value="static">Static text</option>
          </select>
        </Field>
        {element.mode === "dynamic" ? (
          <Field label="XML Path">
            <input
              value={element.xmlPath ?? ""}
              onChange={(e) => patch({ xmlPath: e.target.value })}
              placeholder="/Invoice/Header/InvoiceNo"
            />
          </Field>
        ) : (
          <Field label="Static Value">
            <input
              value={element.staticValue ?? ""}
              onChange={(e) => patch({ staticValue: e.target.value })}
            />
          </Field>
        )}
      </Section>

      {element.type === "table" && (
        <Section title="Repeating Section">
          <Field label="Repeat Path">
            <input
              value={element.repeatPath ?? ""}
              onChange={(e) => patch({ repeatPath: e.target.value })}
              placeholder="/Invoice/Lines/Line"
            />
          </Field>
          <ColumnsEditor element={element} />
        </Section>
      )}

      <Section title="Layout">
        <div className="row">
          <Field label="X">
            <input
              type="number"
              value={element.x}
              onChange={(e) => patch({ x: Number(e.target.value) })}
            />
          </Field>
          <Field label="Y">
            <input
              type="number"
              value={element.y}
              onChange={(e) => patch({ y: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="row">
          <Field label="W">
            <input
              type="number"
              value={element.width}
              onChange={(e) => patch({ width: Number(e.target.value) })}
            />
          </Field>
          <Field label="H">
            <input
              type="number"
              value={element.height}
              onChange={(e) => patch({ height: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Formatting">
        <div className="row">
          <Field label="Font size">
            <input
              type="number"
              value={element.format.fontSize ?? 14}
              onChange={(e) => patchFormat({ fontSize: Number(e.target.value) })}
            />
          </Field>
          <Field label="Align">
            <select
              value={element.format.align ?? "left"}
              onChange={(e) =>
                patchFormat({ align: e.target.value as "left" | "center" | "right" })
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>
        </div>
        <Field label="Color">
          <input
            type="color"
            value={element.format.color ?? "#222222"}
            onChange={(e) => patchFormat({ color: e.target.value })}
          />
        </Field>
        <Field label="Visible">
          <input
            type="checkbox"
            checked={element.format.visible !== false}
            onChange={(e) => patchFormat({ visible: e.target.checked })}
          />
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="prop-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field-inline">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ColumnsEditor({ element }: { element: CanvasElement }) {
  const { updateElement } = useEditor();
  const columns = element.columns ?? [];

  const setColumns = (cols: TableColumn[]) => updateElement(element.id, { columns: cols });
  const updateCol = (i: number, patch: Partial<TableColumn>) =>
    setColumns(columns.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="columns-editor">
      <div className="row between">
        <span className="muted">Columns</span>
        <button
          onClick={() =>
            setColumns([
              ...columns,
              { id: `col-${columns.length + 1}`, label: `Column ${columns.length + 1}`, xmlPath: "" },
            ])
          }
        >
          + Add column
        </button>
      </div>
      {columns.map((c, i) => (
        <div key={c.id} className="col-row">
          <input
            value={c.label}
            placeholder="Label"
            onChange={(e) => updateCol(i, { label: e.target.value })}
          />
          <input
            value={c.xmlPath}
            placeholder="relative path (e.g. Description)"
            onChange={(e) => updateCol(i, { xmlPath: e.target.value })}
          />
          <button
            className="danger"
            onClick={() => setColumns(columns.filter((_, idx) => idx !== i))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
