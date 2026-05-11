import { useState } from "react";

import type { XmlNode } from "../types/template";

interface Props {
  root: XmlNode;
  onPick: (node: XmlNode) => void;
}

export function XmlTreeViewer({ root, onPick }: Props) {
  return (
    <div className="xml-tree" role="tree">
      <TreeNode node={root} onPick={onPick} depth={0} defaultOpen />
    </div>
  );
}

function TreeNode({
  node,
  onPick,
  depth,
  defaultOpen = false,
}: {
  node: XmlNode;
  onPick: (n: XmlNode) => void;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth < 2);
  const hasChildren = node.children.length > 0;
  const sample = node.value && node.value.length > 0 ? node.value : null;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/x-xml-path", node.path);
    e.dataTransfer.setData("text/plain", node.path);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="tree-node" style={{ marginLeft: depth * 12 }}>
      <div className="tree-row">
        {hasChildren ? (
          <button
            className="twisty"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="twisty placeholder" />
        )}
        <span
          className={`tree-label${node.isRepeating ? " repeating" : ""}`}
          draggable
          onDragStart={handleDragStart}
          onClick={() => onPick(node)}
          title={node.path}
        >
          {node.name}
          {node.isRepeating && <span className="badge-tag">×</span>}
        </span>
        {sample && <span className="tree-sample">= {sample}</span>}
      </div>
      {open && hasChildren && (
        <div className="tree-children">
          {node.children.map((c, i) => (
            <TreeNode key={`${c.path}-${i}`} node={c} onPick={onPick} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
