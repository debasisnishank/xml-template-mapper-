import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useEditor } from "../store/editorStore";
import type { Country } from "../types/template";

export function UploadPage() {
  const navigate = useNavigate();
  const setBootstrap = useEditor((s) => s.setBootstrap);

  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountry] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.countries().then(setCountries).catch((e) => setError(String(e)));
  }, []);

  const onProceed = async () => {
    setError(null);
    if (!country) return setError("Select a country");
    if (!file) return setError("Choose an XML file");
    if (!file.name.toLowerCase().endsWith(".xml"))
      return setError("File must have a .xml extension");

    setBusy(true);
    try {
      const parsed = await api.parseXml(file);
      setBootstrap({ country, parsed, fileName: file.name });
      navigate("/editor");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page upload-page">
      <h1>Create Mapping Template</h1>
      <p className="muted">
        Pick a country, upload one of its XML invoices, then design a reusable visual layout.
      </p>

      <div className="card">
        <label className="field">
          <span>Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">— Select —</option>
            {countries.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
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
          {file && <span className="hint">{file.name} ({Math.round(file.size / 1024)} KB)</span>}
        </label>

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button onClick={onProceed} disabled={busy} className="primary">
            {busy ? "Parsing…" : "Proceed to Editor"}
          </button>
          <button onClick={() => navigate("/verify")} className="ghost">
            Verify with Existing Template →
          </button>
        </div>
      </div>
    </div>
  );
}
