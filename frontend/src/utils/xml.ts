import type { XmlNode } from "../types/template";

export function findNodeByPath(root: XmlNode, path: string): XmlNode | null {
  const segments = path.replace(/^\//, "").split("/").filter(Boolean);
  if (segments.length === 0) return null;
  if (segments[0] === root.name) return walk(root, segments.slice(1));
  return walk(root, segments);
}

function walk(node: XmlNode, segments: string[]): XmlNode | null {
  if (segments.length === 0) return node;
  const [head, ...rest] = segments;
  for (const child of node.children) {
    if (child.name === head) {
      const found = walk(child, rest);
      if (found) return found;
    }
  }
  return null;
}

export function previewValue(root: XmlNode | null, path?: string): string {
  if (!root || !path) return "";
  const node = findNodeByPath(root, path);
  if (!node) return "";
  return node.value ?? "";
}
