"use client";

import React from "react";
import {
  RecalledEpisodeItem,
  CypherTraceEntry,
  GraphDataResponse,
} from "../types/api";
import { History, Terminal, Database, Clock } from "lucide-react";

interface MemoryCypherTabProps {
  recalledEpisodes: RecalledEpisodeItem[];
  graphData: GraphDataResponse | null;
  cypherTraces: CypherTraceEntry[];
}

export function MemoryCypherTab({
  recalledEpisodes,
  graphData,
  cypherTraces,
}: MemoryCypherTabProps) {
  // Extract all existing (:Episode) nodes stored persistently in the tenant's FalkorDB graph
  const allStoredEpisodes = (graphData?.nodes || []).filter(
    (n) => n.label === "Episode"
  );

  return (
    <div className="grid grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] overflow-hidden font-sans">
      {/* Left Column (5 Cols): Cross-Session Episodic Memory */}
      <div className="col-span-5 flex flex-col gap-4 overflow-y-auto pr-2">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-cyan-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              Cross-Session Episodic Memory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stateful incident breadcrumbs, query logs, and past agent resolutions persisted in FalkorDB (Track 2: Agent Memory & Coordination).
          </p>
        </div>

        {/* Recalled in Current Active Run */}
        {recalledEpisodes.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
              Recalled Precedents in Latest Run ({recalledEpisodes.length})
            </div>
            <div className="space-y-2">
              {recalledEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="bg-white border border-cyan-200 rounded-lg p-3.5 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-800 font-semibold">
                      {ep.id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold">
                      {ep.decision}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-900 leading-snug">
                    {ep.query}
                  </p>
                  <p className="text-[11px] text-slate-500 italic leading-relaxed">
                    {ep.rationale}
                  </p>
                  {ep.timestamp && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Timestamp: {ep.timestamp}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Stored Episode Nodes in Tenant's Isolated Graph */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
            <span>Persistent Graph Memory Nodes ({allStoredEpisodes.length})</span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">
              FalkorDB Namespace
            </span>
          </div>

          <div className="space-y-2">
            {allStoredEpisodes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs text-slate-400 italic">
                No episodic memory nodes stored yet for this tenant. Run a governance scenario to create the first Episode breadcrumb.
              </div>
            ) : (
              allStoredEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-700 font-semibold">
                      {ep.id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      {String(ep.properties?.decision || "RESOLVED")}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-900 leading-snug">
                    {String(ep.properties?.query || ep.name)}
                  </p>
                  {ep.properties?.rationale && (
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">
                      {String(ep.properties.rationale)}
                    </p>
                  )}
                  {ep.properties?.timestamp && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Created: {String(ep.properties.timestamp)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column (7 Cols): Parameterized OpenCypher Execution Log */}
      <div className="col-span-7 flex flex-col gap-4 overflow-y-auto pl-2">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              Parameterized OpenCypher Telemetry Trace ({cypherTraces.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete real-time query trace executed against the isolated tenant graph with bound parameters, execution duration, and rows returned.
          </p>
        </div>

        <div className="space-y-3">
          {cypherTraces.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400 italic">
              No OpenCypher queries executed in the current session. Run a preset or custom request from the Command & Governance tab to inspect live Cypher queries.
            </div>
          ) : (
            cypherTraces.map((t, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {t.agent_node}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-800 font-medium">{t.description}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-slate-400" />
                      Rows: {t.rows_returned}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {t.execution_ms} ms
                    </span>
                  </div>
                </div>

                {/* Dark syntax-styled code block */}
                <pre className="text-slate-100 text-xs font-mono bg-slate-900 p-3.5 rounded-lg overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                  {t.cypher}
                </pre>

                {Object.keys(t.params).length > 0 && (
                  <div className="text-xs text-slate-600 font-mono flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-sans font-semibold">
                      Parameters:
                    </span>
                    <code className="text-indigo-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      {JSON.stringify(t.params)}
                    </code>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
