"use client";

import React, { useState } from "react";
import { CypherTraceEntry } from "../types/api";
import { Terminal, ChevronUp, ChevronDown } from "lucide-react";

interface CypherTracePanelProps {
  traces: CypherTraceEntry[];
}

export function CypherTracePanel({ traces }: CypherTracePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-slate-200 bg-white font-sans text-xs shadow-xs">
      {/* Drawer Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-8 px-4 flex items-center justify-between text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition border-b border-transparent hover:border-slate-200"
      >
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-semibold text-slate-800 text-xs">
            Cypher Execution Log ({traces.length})
          </span>
        </div>
        <div className="flex items-center space-x-1 text-slate-500 text-xs">
          <span>{isExpanded ? "Collapse" : "Expand"}</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Drawer Content */}
      {isExpanded && (
        <div className="max-h-60 overflow-y-auto p-4 space-y-3 bg-slate-50 border-t border-slate-200">
          {traces.length === 0 ? (
            <div className="text-slate-400 text-xs text-center py-2 italic font-sans">
              No Cypher queries executed yet in the active session.
            </div>
          ) : (
            traces.map((t, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-indigo-600 font-semibold font-mono">{t.agent_node}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-700 font-medium">{t.description}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
                    <span>Rows: {t.rows_returned}</span>
                    <span>Duration: {t.execution_ms} ms</span>
                  </div>
                </div>

                <pre className="text-slate-800 text-[11px] font-mono bg-slate-50 p-2.5 rounded-md overflow-x-auto border border-slate-200/80 leading-relaxed">
                  {t.cypher}
                </pre>

                {Object.keys(t.params).length > 0 && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Params:{" "}
                    <code className="text-indigo-700 font-semibold">
                      {JSON.stringify(t.params)}
                    </code>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
