import type {
  Country,
  ParsedXml,
  Template,
  TemplateSummary,
  VerificationResult,
} from "../types/template";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  countries: () => request<Country[]>("/api/countries"),

  parseXml: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<ParsedXml>("/api/xml/parse", { method: "POST", body: fd });
  },

  listTemplates: (country?: string) =>
    request<TemplateSummary[]>(
      country
        ? `/api/templates?country=${encodeURIComponent(country)}`
        : "/api/templates"
    ),

  getTemplate: (id: string) => request<Template>(`/api/templates/${id}`),

  createTemplate: (payload: Omit<Template, "id" | "createdAt" | "updatedAt">) =>
    request<Template>("/api/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTemplate: (id: string, payload: Partial<Template>) =>
    request<Template>(`/api/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteTemplate: (id: string) =>
    request<void>(`/api/templates/${id}`, { method: "DELETE" }),

  verify: (templateId: string, file: File) => {
    const fd = new FormData();
    fd.append("template_id", templateId);
    fd.append("file", file);
    return request<VerificationResult>("/api/verify", { method: "POST", body: fd });
  },
};
