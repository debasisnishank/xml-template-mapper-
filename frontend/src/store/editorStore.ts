import { create } from "zustand";

import type {
  CanvasElement,
  CanvasMeta,
  ElementType,
  ParsedXml,
} from "../types/template";

interface EditorState {
  country: string;
  parsed: ParsedXml | null;
  fileName: string | null;
  templateId: string | null;
  templateName: string;
  canvas: CanvasMeta;
  elements: CanvasElement[];
  selectedId: string | null;

  setBootstrap: (args: {
    country: string;
    parsed: ParsedXml;
    fileName: string;
  }) => void;
  loadTemplate: (args: {
    id: string;
    name: string;
    country: string;
    canvas: CanvasMeta;
    elements: CanvasElement[];
  }) => void;
  setTemplateName: (name: string) => void;
  addElement: (type: ElementType, partial?: Partial<CanvasElement>) => string;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  bindXmlPath: (id: string, xmlPath: string) => void;
  reset: () => void;
}

const defaultCanvas: CanvasMeta = { width: 1200, height: 800, background: "#ffffff" };

const defaultsByType = (type: ElementType): Partial<CanvasElement> => {
  switch (type) {
    case "label":
      return { width: 160, height: 28, label: "Label" };
    case "badge":
      return { width: 90, height: 26, label: "Badge" };
    case "table":
      return {
        width: 600,
        height: 240,
        label: "Table",
        columns: [{ id: "col-1", label: "Column 1", xmlPath: "" }],
      };
    case "textbox":
    default:
      return { width: 200, height: 36, label: "Text" };
  }
};

let elementCounter = 0;
const nextId = (type: ElementType) => `el-${type}-${++elementCounter}-${Date.now().toString(36)}`;

export const useEditor = create<EditorState>((set) => ({
  country: "",
  parsed: null,
  fileName: null,
  templateId: null,
  templateName: "",
  canvas: defaultCanvas,
  elements: [],
  selectedId: null,

  setBootstrap: ({ country, parsed, fileName }) =>
    set({
      country,
      parsed,
      fileName,
      templateId: null,
      templateName: "",
      canvas: defaultCanvas,
      elements: [],
      selectedId: null,
    }),

  loadTemplate: ({ id, name, country, canvas, elements }) =>
    set({
      templateId: id,
      templateName: name,
      country,
      canvas,
      elements,
      selectedId: null,
    }),

  setTemplateName: (templateName) => set({ templateName }),

  addElement: (type, partial = {}) => {
    const id = partial.id ?? nextId(type);
    const base: CanvasElement = {
      id,
      type,
      label: "",
      mode: "dynamic",
      x: 40,
      y: 40,
      width: 200,
      height: 36,
      format: { visible: true },
      ...defaultsByType(type),
      ...partial,
    };
    set((s) => ({ elements: [...s.elements, base], selectedId: id }));
    return id;
  },

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    })),

  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  selectElement: (selectedId) => set({ selectedId }),

  bindXmlPath: (id, xmlPath) =>
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              xmlPath,
              mode: "dynamic",
              label: el.label || xmlPath.split("/").filter(Boolean).pop() || el.label,
            }
          : el
      ),
    })),

  reset: () =>
    set({
      country: "",
      parsed: null,
      fileName: null,
      templateId: null,
      templateName: "",
      canvas: defaultCanvas,
      elements: [],
      selectedId: null,
    }),
}));
