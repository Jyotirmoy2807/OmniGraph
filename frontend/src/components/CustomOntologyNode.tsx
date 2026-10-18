"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { GraphNodeDTO, OntologyLabelMeta } from "../types/api";

interface CustomOntologyNodeData {
  label: string;
  dto: GraphNodeDTO;
  meta: OntologyLabelMeta;
  highlightColor?: string;
}

export const CustomOntologyNode = memo(function CustomOntologyNode({
  data,
  selected,
}: NodeProps<CustomOntologyNodeData>) {
  const { dto, meta, highlightColor } = data;
  const isHighlighted = dto.highlighted;
  const ontologyColor = meta.color || "#475569";

  // Check for badge attributes (role, criticality, clearance_level, enforcement)
  const roleBadge =
    dto.properties?.criticality ||
    dto.properties?.clearance_level ||
    dto.properties?.enforcement ||
    dto.properties?.role;

  return (
    <div
      className={`min-w-[180px] max-w-[220px] rounded-lg bg-white shadow-xs border border-slate-200 px-3 py-2 text-left font-sans transition-all duration-200 hover:shadow-md ${
        isHighlighted
          ? `ring-2 ring-offset-2 shadow-md ${
              highlightColor === "#f43f5e"
                ? "ring-rose-500 ring-offset-white"
                : "ring-emerald-500 ring-offset-white"
            }`
          : selected
          ? "ring-2 ring-indigo-500 ring-offset-1"
          : ""
      }`}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: ontologyColor,
      }}
    >
      {/* Target and Source Handles for clean multi-directional edge routing */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-300 !border !border-white"
      />

      <div className="flex flex-col space-y-1">
        {/* Top row: Category Badge & Property Tag */}
        <div className="flex items-center justify-between gap-1">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${ontologyColor}15`,
              color: ontologyColor,
            }}
          >
            {dto.label}
          </span>

          {roleBadge && (
            <span className="text-[9px] font-mono text-slate-500 bg-slate-100 border border-slate-200/80 px-1 rounded truncate max-w-[80px]">
              {String(roleBadge)}
            </span>
          )}
        </div>

        {/* Bottom row: Node Name */}
        <div className="text-xs font-semibold text-slate-900 truncate leading-snug pt-0.5">
          {dto.name}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-300 !border !border-white"
      />
    </div>
  );
});
