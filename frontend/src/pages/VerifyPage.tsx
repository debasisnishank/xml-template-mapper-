import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "../api/client";
import {
  buildVerificationReport,
  downloadJson,
  exportElementToPdf,
  safeFileSlug,
} from "../utils/export";
import type {
  Country,
  Template,
  TemplateSummary,
  VerificationResult,
} from "../types/template";

export function VerifyPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountry] = useState<string>("");
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const renderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.countries().then(setCountries).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    setTemplateId("");
    setTemplate(null);
    setResult(null);
    if (!country) {
      setTemplates([]);
      return;
    }
    api.listTemplates(country).then(setTemplates).catch((e) => setError(String(e)));
  }, [country]);

  useEffect(() => {
    setResult(null);
    if (!templateId) {
      setTemplate(null);
      return;
    }
    api.getTemplate(templateId).then(setTemplate).catch((e) => setError(String(e)));
  }, [templateId]);

  const valuesById = useMemo(() => {
    const m = new Map<string, VerificationResult["values"][number]>();
    if (result) for (const v of result.values) m.set(v.elementId, v);
    return m;
  }, [result]);

  const issuesById = useMemo(() => {
    const m = new Map<string, VerificationResult["issues"]>();
    if (result) for (const i of result.issues) {
      const arr = m.get(i.elementId) ?? [];
      arr.push(i);
      m.set(i.elementId, arr);
    }
    return m;
  }, [result]);

  const run = async () => {
    setError(null);
    if (!templateId) return setError("Pick a template");
    if (!file) return setError("Choose an XML file");
    setBusy(true);
    try {
      const r = await api.verify(templateId, file);
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async () => {
    if (!renderRef.current || !template || !result) return;
    setError(null);
    setExporting(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const name = `${safeFileSlug(template.name)}-${stamp}.pdf`;
      await exportElementToPdf(renderRef.current, name, {
        title: `${template.name} — ${template.country}`,
        subtitle: `Source: ${file?.name ?? "uploaded XML"}  ·  ${result.okCount} ok / ${result.issueCount} issues`,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const exportJson = () => {
    if (!template || !result) return;
    const report = buildVerificationReport(template, result, file?.name ?? null);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(report, `${safeFileSlug(template.name)}-${stamp}.json`);
  };

  return (
    <div className="page verify-page">
      <h1>Verify XML Against Template</h1>

      <div className="card row gap">
        <label className="field">
          <span>Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">— Select —</option>
            {countries.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Template</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            disabled={!country || templates.length === 0}
          >
            <option value="">
              {country
                ? templates.length
                  ? "— Select —"
                  : "No templates for this country"
                : "Pick a country first"}
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.version ? `v${t.version}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>XML File</span>
          <input
            type="file"
            accept=".xml,application/xml,text/xml"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="actions">
          <button className="primary" onClick={run} disabled={busy}>
            {busy ? "Verifying…" : "Run Verification"}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {result && template && (
        <>
          <div className="summary">
            <span className="chip ok">{result.okCount} ok</span>
            <span className={`chip ${result.issueCount ? "warn" : "ok"}`}>
              {result.issueCount} issue{result.issueCount === 1 ? "" : "s"}
            </span>
            <span className="muted">{result.templateName} — {result.country}</span>
            <span className="spacer" />
            <button onClick={exportPdf} disabled={exporting}>
              {exporting ? "Generating…" : "Export PDF"}
            </button>
            <button onClick={exportJson}>Download JSON report</button>
          </div>

          <div className="render-wrap">
            <div
              ref={renderRef}
              className="canvas readonly"
              style={{
                width: template.canvas.width,
                height: template.canvas.height,
                background: template.canvas.background ?? "#fff",
              }}
            >
              {template.elements.map((el) => {
                const v = valuesById.get(el.id);
                const issues = issuesById.get(el.id) ?? [];
                const hasIssue = issues.length > 0;
                return (
                  <div
                    key={el.id}
                    className={`ce ce-${el.type}${hasIssue ? " issue" : ""}`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      fontSize: el.format.fontSize ?? undefined,
                      color: el.format.color ?? undefined,
                      textAlign: el.format.align ?? undefined,
                      fontWeight: el.format.fontWeight ?? undefined,
                    }}
                    title={hasIssue ? issues.map((i) => i.message).join("\n") : ""}
                  >
                    {el.type === "label" && <span className="ce-label-text">{el.label}</span>}
                    {el.type === "badge" && (
                      <span className="ce-badge">{(v?.value ?? el.label) || "—"}</span>
                    )}
                    {el.type === "textbox" && (
                      <>
                        {el.label && <div className="ce-cap">{el.label}</div>}
                        <div className="ce-val">
                          {v?.value ?? <em className="muted">missing</em>}
                        </div>
                      </>
                    )}
                    {el.type === "table" && (
                      <RenderedTable element={el} rows={v?.rows ?? []} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {result.issues.length > 0 && (
            <div className="issues">
              <h3>Issues</h3>
              <ul>
                {result.issues.map((i, idx) => (
                  <li key={idx} className={`issue-${i.severity}`}>
                    <strong>{i.label}</strong> — {i.message}
                    {i.xmlPath && <code> {i.xmlPath}</code>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RenderedTable({
  element,
  rows,
}: {
  element: import("../types/template").CanvasElement;
  rows: Record<string, string | null>[];
}) {
  const cols = element.columns ?? [];
  return (
    <div className="ce-table">
      <div className="ce-table-cap">{element.label}</div>
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.id}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length}><em className="muted">no rows</em></td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c.id}>{row[c.id] ?? <em className="muted">—</em>}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
