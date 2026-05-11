export type ElementType = "textbox" | "label" | "badge" | "table";
export type ValueMode = "dynamic" | "static";

export interface Format {
  font?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  align?: "left" | "center" | "right";
  dateFormat?: string;
  numberFormat?: string;
  visible?: boolean;
}

export interface TableColumn {
  id: string;
  label: string;
  xmlPath: string;
  width?: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  label: string;
  xmlPath?: string;
  staticValue?: string;
  mode: ValueMode;
  x: number;
  y: number;
  width: number;
  height: number;
  format: Format;
  repeatPath?: string;
  columns?: TableColumn[];
}

export interface CanvasMeta {
  width: number;
  height: number;
  background?: string;
}

export interface Template {
  id: string;
  name: string;
  country: string;
  description?: string;
  version?: string;
  canvas: CanvasMeta;
  elements: CanvasElement[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSummary {
  id: string;
  name: string;
  country: string;
  description?: string;
  version?: string;
  updatedAt: string;
}

export interface XmlNode {
  name: string;
  path: string;
  attributes: Record<string, string>;
  value: string | null;
  children: XmlNode[];
  isRepeating: boolean;
  namespace?: string | null;
}

export interface ParsedXml {
  root: XmlNode;
  namespaces: Record<string, string>;
}

export interface FieldValue {
  elementId: string;
  label: string;
  xmlPath?: string | null;
  value?: string | null;
  rows?: Record<string, string | null>[] | null;
}

export interface FieldIssue {
  elementId: string;
  label: string;
  xmlPath?: string | null;
  severity: "missing" | "empty" | "error" | "info";
  message: string;
}

export interface VerificationResult {
  templateId: string;
  templateName: string;
  country: string;
  values: FieldValue[];
  issues: FieldIssue[];
  okCount: number;
  issueCount: number;
}

export interface Country {
  code: string;
  name: string;
}
