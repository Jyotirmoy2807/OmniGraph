"use client";

import React from "react";
import { GraphNodeDTO, OntologyMetadataResponse } from "../types/api";
import { X, Network } from "lucide-react";

interface NodeInspectorSheetProps {
  node: GraphNodeDTO | null;
  ontology: OntologyMetadataResponse | null;
  onClose: () => void;
}

export function NodeInspectorSheet({ node, ontology, onClose }: NodeInspectorSheetProps) {
  if (!node) return null;

  const meta = ontology?.node_labels.find((m) => m.label === node.label);

  return (
    <div className="absolute top-4 left-4 z-20 w-80 bg-white/95 border border-slate-200 rounded-lg shadow-xl p-4 space-y-3 font-mono text-xs backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <Network className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-900 font-bold uppercase tracking-wider">
            Node Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 uppercase text-[10px] font-semibold">Label</span>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold"
            style={{
              backgroundColor: `${meta?.color || "#475569"}18`,
              color: meta?.color || "#334155",
              border: `1px solid ${meta?.color || "#475569"}40`,
            }}
          >
            {node.label}
          </span>
        </div>
        <div className="text-slate-900 font-semibold text-sm pt-1">{node.name}</div>
        <div className="text-slate-400 text-[10px] break-all">ID: {node.id}</div>
      </div>

      {meta && (
        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
          {meta.description}
        </div>
      )}

      {/* Properties Table */}
      <div className="space-y-1 pt-1">
        <span className="text-slate-400 uppercase text-[10px] font-semibold block">Properties</span>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {Object.entries(node.properties).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded text-[11px]"
            >
              <span className="text-slate-500 font-medium">{k}</span>
              <span className="text-slate-800 font-semibold truncate max-w-[140px]">
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
