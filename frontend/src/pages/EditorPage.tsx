import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { Canvas } from "../components/Canvas";
import { PropertiesPanel } from "../components/PropertiesPanel";
import { XmlTreeViewer } from "../components/XmlTreeViewer";
import { useEditor } from "../store/editorStore";

export function EditorPage() {
  const navigate = useNavigate();
  const {
    country,
    parsed,
    fileName,
    templateId,
    templateName,
    canvas,
    elements,
    setTemplateName,
    addElement,
    bindXmlPath,
    selectedId,
    reset,
  } = useEditor();

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parsed) navigate("/");
  }, [parsed, navigate]);

  if (!parsed) return null;

  const onPickXmlNode = (node: { path: string }) => {
    if (selectedId) {
      bindXmlPath(selectedId, node.path);
    } else {
      const label = node.path.split("/").filter(Boolean).pop() ?? "Field";
      addElement("textbox", { xmlPath: node.path, label, mode: "dynamic" });
    }
  };

  const save = async () => {
    setError(null);
    if (!templateName.trim()) {
      setError("Give the template a name before saving");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: templateName.trim(),
        country,
        canvas,
        elements,
      } as Parameters<typeof api.createTemplate>[0];
      const saved = templateId
        ? await api.updateTemplate(templateId, payload)
        : await api.createTemplate(payload);
      setSavedAt(new Date(saved.updatedAt).toLocaleTimeString());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor">
      <div className="editor-toolbar">
        <button className="ghost" onClick={() => { reset(); navigate("/"); }}>
          ← Back
        </button>
        <div className="ctx">
          <span className="chip">{country}</span>
          {fileName && <span className="muted">{fileName}</span>}
        </div>
        <input
          className="template-name"
          placeholder="Template name (e.g. Belgium Invoice v1)"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
        <div className="add-bar">
          <span className="muted">Add:</span>
          <button onClick={() => addElement("textbox")}>Text</button>
          <button onClick={() => addElement("label")}>Label</button>
          <button onClick={() => addElement("badge")}>Badge</button>
          <button onClick={() => addElement("table")}>Table</button>
        </div>
        <button className="primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Template"}
        </button>
      </div>
      {(error || savedAt) && (
        <div className={`bar ${error ? "error" : "success"}`}>
          {error ?? `Saved at ${savedAt}`}
        </div>
      )}

      <div className="editor-grid">
        <aside className="panel left">
          <h2>Source XML</h2>
          <p className="muted small">Drag a node onto the canvas, or select a canvas element first then click a node to bind it.</p>
          <XmlTreeViewer root={parsed.root} onPick={onPickXmlNode} />
        </aside>
        <section className="panel center">
          <Canvas />
        </section>
        <aside className="panel right">
          <h2>Properties</h2>
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}
