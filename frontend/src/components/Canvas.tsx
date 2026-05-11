import { useRef } from "react";

import { useEditor } from "../store/editorStore";
import { previewValue } from "../utils/xml";
import type { CanvasElement } from "../types/template";

export function Canvas() {
  const { canvas, elements, selectedId, selectElement, addElement } = useEditor();
  const ref = useRef<HTMLDivElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const xmlPath = e.dataTransfer.getData("application/x-xml-path");
    if (!xmlPath) return;
    const rect = ref.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 40;
    const y = rect ? e.clientY - rect.top : 40;
    const label = xmlPath.split("/").filter(Boolean).pop() || "Field";
    addElement("textbox", { x, y, label, xmlPath, mode: "dynamic" });
  };

  return (
    <div className="canvas-wrap">
      <div
        ref={ref}
        className="canvas"
        style={{
          width: canvas.width,
          height: canvas.height,
          background: canvas.background ?? "#ffffff",
        }}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={(e) => {
          if (e.target === e.currentTarget) selectElement(null);
        }}
      >
        {elements.length === 0 && (
          <div className="empty-canvas">
            <p>Drag XML fields here, or use the toolbar to add elements.</p>
          </div>
        )}
        {elements.map((el) => (
          <CanvasItem key={el.id} element={el} selected={el.id === selectedId} />
        ))}
      </div>
    </div>
  );
}

function CanvasItem({ element, selected }: { element: CanvasElement; selected: boolean }) {
  const { selectElement, updateElement, parsed } = useEditor();
  const dragRef = useRef<{ ox: number; oy: number; dx: number; dy: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(element.id);
    dragRef.current = {
      ox: element.x,
      oy: element.y,
      dx: e.clientX,
      dy: e.clientY,
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const onMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    updateElement(element.id, {
      x: Math.max(0, dragRef.current.ox + (e.clientX - dragRef.current.dx)),
      y: Math.max(0, dragRef.current.oy + (e.clientY - dragRef.current.dy)),
    });
  };

  const onUp = () => {
    dragRef.current = null;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };

  const value =
    element.mode === "static"
      ? element.staticValue ?? ""
      : previewValue(parsed?.root ?? null, element.xmlPath);

  return (
    <div
      className={`ce ce-${element.type}${selected ? " selected" : ""}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        fontSize: element.format.fontSize ?? undefined,
        color: element.format.color ?? undefined,
        fontWeight: element.format.fontWeight ?? undefined,
        textAlign: element.format.align ?? undefined,
        opacity: element.format.visible === false ? 0.4 : 1,
      }}
      onMouseDown={onMouseDown}
    >
      {element.type === "label" && <span className="ce-label-text">{element.label}</span>}
      {element.type === "badge" && <span className="ce-badge">{value || element.label}</span>}
      {element.type === "textbox" && (
        <>
          {element.label && <div className="ce-cap">{element.label}</div>}
          <div className="ce-val">{value || <em className="muted">no value</em>}</div>
        </>
      )}
      {element.type === "table" && <TablePreview element={element} />}
    </div>
  );
}

function TablePreview({ element }: { element: CanvasElement }) {
  return (
    <div className="ce-table">
      <div className="ce-table-cap">{element.label}</div>
      <table>
        <thead>
          <tr>
            {(element.columns ?? []).map((c) => (
              <th key={c.id}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {(element.columns ?? []).map((c) => (
              <td key={c.id}>
                <em className="muted">{c.xmlPath || "—"}</em>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
