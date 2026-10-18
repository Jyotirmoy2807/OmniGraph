"use client";

import React from "react";
import {
  SwarmExecutionResponse,
  GraphDataResponse,
  GraphNodeDTO,
  OntologyMetadataResponse,
} from "../types/api";
import {
  ShieldCheck,
  ShieldAlert,
  GitBranch,
  FileCheck,
  Send,
  Database,
  Lock,
  Layers,
  X,
  ArrowRight,
} from "lucide-react";

interface GovernanceAuditPanelProps {
  result: SwarmExecutionResponse | null;
  graphData: GraphDataResponse | null;
  ontology: OntologyMetadataResponse | null;
  selectedNode: GraphNodeDTO | null;
  onClearSelectedNode: () => void;
  onNavigateToGraph: () => void;
}

export function GovernanceAuditPanel({
  result,
  graphData,
  ontology,
  selectedNode,
  onClearSelectedNode,
  onNavigateToGraph,
}: GovernanceAuditPanelProps) {
  // 1. If a node is selected on the React Flow canvas, show Node Inspector details
  if (selectedNode) {
    const meta = ontology?.node_labels.find((m) => m.label === selectedNode.label);
    const ontologyColor = meta?.color || "#475569";

    const connectedEdges = (graphData?.edges || []).filter(
      (e) => e.source === selectedNode.id || e.target === selectedNode.id
    );

    return (
      <div className="flex flex-col gap-4 font-sans text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="text-slate-900 font-semibold uppercase tracking-wider text-[11px]">
              Node Inspector
            </span>
          </div>
          <button
            onClick={onClearSelectedNode}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Node Summary Card */}
        <div
          className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2 shadow-2xs"
          style={{ borderLeftWidth: "4px", borderLeftColor: ontologyColor }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${ontologyColor}15`,
                color: ontologyColor,
              }}
            >
              {selectedNode.label}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              ID: {selectedNode.id}
            </span>
          </div>

          <div className="text-sm font-semibold text-slate-900 leading-snug">
            {selectedNode.name}
          </div>

          {meta?.description && (
            <p className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
              {meta.description}
            </p>
          )}
        </div>

        {/* Node Properties */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Properties
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
            {Object.keys(selectedNode.properties || {}).length === 0 ? (
              <div className="text-slate-400 italic">No custom properties.</div>
            ) : (
              Object.entries(selectedNode.properties).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0"
                >
                  <span className="text-slate-500 text-[11px] font-medium">{k}</span>
                  <span className="text-slate-800 font-mono text-[11px] font-semibold truncate max-w-[240px]">
                    {String(v)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Connected Topology Relationships */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Connected Graph Edges ({connectedEdges.length})
          </div>
          <div className="space-y-1.5">
            {connectedEdges.length === 0 ? (
              <div className="text-slate-400 italic bg-white p-3 border border-slate-200 rounded-lg">
                No connected edges found.
              </div>
            ) : (
              connectedEdges.map((e) => (
                <div
                  key={e.id}
                  className="bg-white border border-slate-200 rounded-md p-2 flex items-center justify-between text-xs shadow-2xs"
                >
                  <span className="text-slate-700 truncate max-w-[200px]">
                    {e.source === selectedNode.id ? "Outgoing -> " : "Incoming <- "}
                    {e.source === selectedNode.id ? e.target : e.source}
                  </span>
                  <span className="font-mono text-indigo-600 font-semibold text-[10px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {e.relation}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. If NO query has been executed yet, show structured Tenant Topology Summary
  if (!result) {
    const policies = (graphData?.nodes || []).filter((n) => n.label === "Policy");
    const criticalResources = (graphData?.nodes || []).filter(
      (n) => n.label === "Resource"
    );

    return (
      <div className="flex flex-col gap-5 font-sans text-xs">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tenant Governance & Topology Summary
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-loaded enterprise topology from isolated FalkorDB graph. Trigger any scenario on the left to evaluate fail-closed governance.
          </p>
        </div>

        {/* Active Governance Policies */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Active Governance Policies ({policies.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {policies.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-purple-950">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold shrink-0">
                    {String(p.properties?.enforcement || "FAIL_CLOSED")}
                  </span>
                </div>
                {p.properties?.required_role && (
                  <div className="text-xs text-slate-500">
                    Required Role:{" "}
                    <span className="text-slate-800 font-medium">
                      {String(p.properties.required_role)}
                    </span>
                  </div>
                )}
                {p.properties?.description && (
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {String(p.properties.description)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Critical Protected Resources */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>Protected Operational Resources ({criticalResources.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {criticalResources.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between gap-1.5 shadow-2xs"
              >
                <span className="text-xs text-slate-900 font-medium truncate">
                  {r.name}
                </span>
                <span className="text-[10px] font-mono font-semibold text-amber-800 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 w-fit">
                  {String(r.properties?.criticality || "RESOURCE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Execution Result View (Post-Query)
  const isApproved = result.decision === "APPROVED";

  return (
    <div className="flex flex-col gap-5 font-sans text-xs">
      {/* Prominent Verdict Banner at the Very Top with Direct Navigation to Graph */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
          isApproved
            ? "border-emerald-300 bg-emerald-50/90 text-emerald-950"
            : "border-rose-300 bg-rose-50/90 text-rose-950"
        }`}
      >
        <div className="flex items-start space-x-3 max-w-[80%]">
          {isApproved ? (
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="text-xs font-bold tracking-wider uppercase font-sans">
              {isApproved
                ? "ACTION APPROVED — GOVERNANCE VERIFIED"
                : "ACTION DENIED — FAIL-CLOSED POLICY BLOCK"}
            </div>
            <p className="text-xs leading-relaxed text-slate-700 font-sans">
              {result.rationale}
            </p>
          </div>
        </div>

        {/* Quick jump to graph button */}
        <button
          onClick={onNavigateToGraph}
          className={`shrink-0 font-sans text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-2xs ${
            isApproved
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-rose-600 hover:bg-rose-700 text-white"
          }`}
        >
          <span>
            {isApproved ? "View Reasoning Path in Graph" : "Inspect Blocked Path in Graph"}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Anchored Entity Summary: 2-Column Subgrid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <span className="text-slate-400 text-[10px] uppercase font-semibold block">
            Actor
          </span>
          <span className="text-slate-900 font-semibold block text-sm mt-0.5">
            {result.actor_resolved?.name || "Unresolved"}
          </span>
          <span className="text-slate-500 text-xs block">
            {result.actor_resolved?.role || "N/A"}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <span className="text-slate-400 text-[10px] uppercase font-semibold block">
            Target Resource
          </span>
          <span className="text-slate-900 font-semibold block text-sm mt-0.5">
            {result.resource_resolved?.name || "Unresolved"}
          </span>
          <span className="text-amber-700 text-xs font-semibold block">
            Criticality: {result.resource_resolved?.criticality || "UNKNOWN"}
          </span>
        </div>
      </div>

      {/* Blast Radius Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <GitBranch className="w-3.5 h-3.5 text-amber-600" />
          <span>Blast Radius ({result.blast_radius_resources.length} Downstream Assets)</span>
        </div>
        <div className="space-y-1.5">
          {result.blast_radius_resources.length === 0 ? (
            <div className="text-xs text-slate-400 bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
              No downstream dependent assets affected.
            </div>
          ) : (
            result.blast_radius_resources.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs flex items-center justify-between shadow-2xs"
              >
                <span className="text-slate-800 font-medium">{res.name}</span>
                <span className="text-[10px] font-mono font-semibold text-amber-800 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                  {res.criticality}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Evaluated Policies & Provenance */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <FileCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Evaluated Policies ({result.policies_evaluated.length})</span>
        </div>
        <div className="space-y-2">
          {result.policies_evaluated.map((pol) => (
            <div
              key={pol.policy_id}
              className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-purple-950 font-semibold text-xs">{pol.policy_name}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    pol.complies
                      ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                      : "text-rose-700 border-rose-300 bg-rose-50"
                  }`}
                >
                  {pol.complies ? "COMPLIANT" : "NON-COMPLIANT"}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{pol.reason}</p>
              <div className="text-[11px] text-slate-400 pt-0.5">
                Source Document:{" "}
                <span className="text-emerald-700 font-medium">
                  {pol.source_document}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Dispatch Receipt */}
      {result.webhook_dispatch && result.webhook_dispatch.dispatched && (
        <div className="space-y-2 pt-1 border-t border-slate-200">
          <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>Webhook Dispatch Receipt</span>
          </div>
          <pre className="bg-white border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-emerald-900 overflow-x-auto shadow-2xs leading-relaxed">
            {JSON.stringify(result.webhook_dispatch.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
