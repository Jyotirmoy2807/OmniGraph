"use client";

import React, { useState } from "react";
import { PresetScenario, AgentStepLog } from "../types/api";
import { Play, Check, X, Clock } from "lucide-react";

interface OperationsConsoleProps {
  presets: PresetScenario[];
  onExecuteQuery: (query: string) => void;
  isSwarmRunning: boolean;
  agentSteps: AgentStepLog[];
}

export function OperationsConsole({
  presets,
  onExecuteQuery,
  isSwarmRunning,
  agentSteps,
}: OperationsConsoleProps) {
  const [queryInput, setQueryInput] = useState("");

  const handlePresetClick = (q: string) => {
    setQueryInput(q);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryInput.trim()) {
      onExecuteQuery(queryInput);
    }
  };

  const PIPELINE_NODES = [
    { name: "TriageRouter", label: "Triage & Entity Anchor" },
    { name: "GraphInvestigator", label: "Blast Radius Investigation" },
    { name: "PolicyGatekeeper", label: "Policy Gatekeeper Evaluation" },
    { name: "ActionExecutor", label: "Action & Audit Execution" },
  ];

  const dynamicPlaceholder = presets[0]?.query_text
    ? `e.g. ${presets[0].query_text}`
    : "Enter a custom governance or operational request...";

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* Preset Governance Scenarios */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Preset Governance Scenarios
        </div>

        <div className="space-y-2">
          {presets.map((p) => {
            const isAuth = p.category === "AUTHORIZED";
            return (
              <button
                key={p.id}
                onClick={() => handlePresetClick(p.query_text)}
                disabled={isSwarmRunning}
                className="w-full text-left p-3.5 rounded-lg bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition flex flex-col space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {p.label}
                  </span>
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                      isAuth
                        ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                        : "text-rose-700 border-rose-200 bg-rose-50"
                    }`}
                  >
                    {isAuth ? "AUTHORIZED" : "FAIL-CLOSED"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {p.query_text}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dispatch Custom Request */}
      <form onSubmit={handleCustomSubmit} className="space-y-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Dispatch Custom Request
        </div>
        <div>
          <textarea
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={isSwarmRunning}
            placeholder={dynamicPlaceholder}
            rows={3}
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition"
          />
        </div>
        <button
          type="submit"
          disabled={isSwarmRunning || !queryInput.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-sans text-sm font-medium py-2.5 px-4 rounded-lg shadow-2xs transition-colors flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isSwarmRunning ? "Executing Swarm..." : "Run Swarm"}</span>
        </button>
      </form>

      {/* Connected Vertical Stepper: Execution Pipeline */}
      <div className="space-y-2.5 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Execution Pipeline
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="space-y-4">
            {PIPELINE_NODES.map((step, idx) => {
              const stepLog = agentSteps.find((s) => s.node_name === step.name);
              const isCompleted = stepLog && stepLog.status === "COMPLETED";
              const isBlocked = stepLog && stepLog.status === "BLOCKED";
              const isLast = idx === PIPELINE_NODES.length - 1;

              return (
                <div key={step.name} className="relative flex items-start gap-3">
                  {!isLast && (
                    <div
                      className={`absolute left-[10px] top-5 w-0.5 h-full ${
                        isCompleted ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  )}

                  <div
                    className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isBlocked
                        ? "bg-rose-600 text-white"
                        : "bg-slate-100 text-slate-500 border border-slate-300"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : isBlocked ? (
                      <X className="w-3 h-3 stroke-[3]" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-800">
                        {step.name}
                      </span>
                      {stepLog && (
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {stepLog.duration_ms}ms
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {stepLog ? stepLog.summary : step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
