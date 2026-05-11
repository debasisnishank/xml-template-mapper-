import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import type { Template, VerificationResult } from "../types/template";

export async function exportElementToPdf(
  el: HTMLElement,
  fileName: string,
  opts: { title?: string; subtitle?: string } = {}
): Promise<void> {
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");
  const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 32;
  const headerHeight = opts.title || opts.subtitle ? 48 : 0;

  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2 - headerHeight;

  const ratio = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
  const drawWidth = canvas.width * ratio;
  const drawHeight = canvas.height * ratio;
  const x = (pageWidth - drawWidth) / 2;
  const y = margin + headerHeight;

  if (opts.title) {
    pdf.setFontSize(14);
    pdf.text(opts.title, margin, margin + 16);
  }
  if (opts.subtitle) {
    pdf.setFontSize(10);
    pdf.setTextColor(110);
    pdf.text(opts.subtitle, margin, margin + 32);
    pdf.setTextColor(0);
  }

  pdf.addImage(imgData, "PNG", x, y, drawWidth, drawHeight, undefined, "FAST");
  pdf.save(fileName);
}

export function downloadJson(payload: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, fileName);
}

export function buildVerificationReport(
  template: Template,
  result: VerificationResult,
  sourceFileName: string | null
) {
  return {
    generatedAt: new Date().toISOString(),
    sourceFile: sourceFileName,
    template: {
      id: template.id,
      name: template.name,
      country: template.country,
      version: template.version ?? null,
    },
    summary: {
      okCount: result.okCount,
      issueCount: result.issueCount,
    },
    values: result.values,
    issues: result.issues,
  };
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function safeFileSlug(input: string): string {
  return (
    input
      .normalize("NFKD")
      .replace(/[^\w\d-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "export"
  );
}
