"use client";

import React, { useMemo, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { GraphDataResponse, OntologyMetadataResponse, GraphNodeDTO } from "../types/api";
import { getLayoutedElements } from "../lib/dagreLayout";
import { CustomOntologyNode } from "./CustomOntologyNode";
import { X, Layers, Eye, EyeOff } from "lucide-react";

interface GraphViewportProps {
  graphData: GraphDataResponse | null;
  ontology: OntologyMetadataResponse | null;
  onNodeClick: (node: GraphNodeDTO) => void;
  decisionOutcome?: string;
  selectedNode: GraphNodeDTO | null;
  onClearSelectedNode: () => void;
  isActiveTab: boolean;
}

const nodeTypes = {
  ontologyNode: CustomOntologyNode,
};

function InnerGraphViewport({
  graphData,
  ontology,
  onNodeClick,
  decisionOutcome,
  selectedNode,
  onClearSelectedNode,
  isActiveTab,
}: GraphViewportProps) {
  const { fitView } = useReactFlow();
  const [highlightOnly, setHighlightOnly] = useState(false);

  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    if (!graphData || !ontology) {
      return { nodes: [], edges: [] };
    }
    return getLayoutedElements(
      graphData.nodes,
      graphData.edges,
      ontology.node_labels,
      "LR",
      decisionOutcome
    );
  }, [graphData, ontology, decisionOutcome]);

  // Apply Dimming filter when highlightOnly is enabled
  const nodes = useMemo(() => {
    if (!highlightOnly) return rawNodes;
    return rawNodes.map((n) => {
      const isHighlighted = n.data?.dto?.highlighted;
      return {
        ...n,
        style: {
          ...n.style,
          opacity: isHighlighted ? 1 : 0.2,
          transition: "opacity 0.3s ease",
        },
      };
    });
  }, [rawNodes, highlightOnly]);

  const edges = useMemo(() => {
    if (!highlightOnly) return rawEdges;
    return rawEdges.map((e) => {
      const isHighlighted = (e as any).animated || (e.style?.strokeWidth && Number(e.style.strokeWidth) > 2);
      return {
        ...e,
        style: {
          ...e.style,
          opacity: isHighlighted ? 1 : 0.15,
        },
      };
    });
  }, [rawEdges, highlightOnly]);

  // Auto-fit view when tab becomes active or data updates to prevent clipped nodes
  useEffect(() => {
    if (isActiveTab && rawNodes.length > 0) {
      const timeout = setTimeout(() => {
        fitView({ padding: 0.22, duration: 400 });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isActiveTab, rawNodes.length, fitView]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    if (node.data && node.data.dto) {
      onNodeClick(node.data.dto);
    }
  };

  const selectedMeta = ontology?.node_labels.find((m) => m.label === selectedNode?.label);
  const selectedConnectedEdges = (graphData?.edges || []).filter(
    (e) => e.source === selectedNode?.id || e.target === selectedNode?.id
  );

  return (
    <div className="relative w-full h-full bg-slate-50 font-sans overflow-hidden">
      {/* 1. Dynamic Ontology Legend Pill Bar anchored at TOP-LEFT */}
      {ontology && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-white/95 backdrop-blur px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-medium text-slate-700">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
            Ontology
          </span>
          <div className="flex items-center gap-3">
            {ontology.node_labels.map((lbl) => (
              <div key={lbl.label} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-2xs"
                  style={{ backgroundColor: lbl.color }}
                />
                <span className="text-slate-700 text-xs font-medium">{lbl.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Decision Path Filter Toggle Pill anchored at TOP-RIGHT */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setHighlightOnly(!highlightOnly)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition shadow-sm border ${
            highlightOnly
              ? "bg-indigo-600 text-white border-indigo-700"
              : "bg-white/95 backdrop-blur text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          {highlightOnly ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{highlightOnly ? "Highlight Decision Path Only" : "Show All Nodes"}</span>
        </button>
      </div>

      {/* 3. Floating Node Inspector Card when a user clicks a node */}
      {selectedNode && (
        <div className="absolute top-16 right-4 w-84 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl p-4 space-y-3 z-20 font-sans text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-900 font-semibold uppercase tracking-wider text-[11px]">
                Node Details
              </span>
            </div>
            <button
              onClick={onClearSelectedNode}
              className="text-slate-400 hover:text-slate-600 transition p-1 rounded hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
            style={{ borderLeftWidth: "4px", borderLeftColor: selectedMeta?.color || "#475569" }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${selectedMeta?.color || "#475569"}15`,
                  color: selectedMeta?.color || "#475569",
                }}
              >
                {selectedNode.label}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                {selectedNode.id}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-900 leading-snug pt-0.5">
              {selectedNode.name}
            </div>
          </div>

          {/* Properties Table */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Properties
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded text-[11px]"
                >
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="text-slate-900 font-mono font-semibold truncate max-w-[150px]">
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Edges */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Connected Relationships ({selectedConnectedEdges.length})
            </span>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedConnectedEdges.map((e) => (
                <div
                  key={e.id}
                  className="bg-slate-50 border border-slate-200/70 rounded px-2 py-1 flex items-center justify-between text-[10px]"
                >
                  <span className="text-slate-600 truncate max-w-[130px]">
                    {e.source === selectedNode.id ? "-> " : "<- "}
                    {e.source === selectedNode.id ? e.target : e.source}
                  </span>
                  <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                    {e.relation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Canvas with Controls at Bottom-Left & MiniMap at Bottom-Right */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.22, duration: 400 }}
        minZoom={0.15}
        maxZoom={2.5}
        defaultEdgeOptions={{ animated: false }}
      >
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls className="!bg-white !border-slate-200 !text-slate-600 !rounded-lg !shadow-sm !bottom-4 !left-4" />
        <MiniMap
          nodeStrokeColor="#cbd5e1"
          nodeColor="#e2e8f0"
          maskColor="rgba(248, 250, 252, 0.8)"
          className="!bg-white !border-slate-200 !rounded-xl !shadow-sm !bottom-4 !right-4"
        />
      </ReactFlow>
    </div>
  );
}

export function GraphViewport(props: GraphViewportProps) {
  return (
    <ReactFlowProvider>
      <InnerGraphViewport {...props} />
    </ReactFlowProvider>
  );
}
