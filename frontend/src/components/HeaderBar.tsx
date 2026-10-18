"use client";

import React from "react";
import { TenantSummary } from "../types/api";
import { WorkspaceTab } from "../types/tabs";
import {
  Database,
  Plus,
  RotateCcw,
  ShieldCheck,
  Network,
  Terminal,
  FileText,
} from "lucide-react";

interface HeaderBarProps {
  tenants: TenantSummary[];
  activeTenantId: string;
  onSelectTenant: (id: string) => void;
  nodeCount: number;
  edgeCount: number;
  episodeCount: number;
  cypherTraceCount: number;
  backendConnected: boolean;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenNewTenantModal: () => void;
  onResetGraph: () => void;
  isLoading: boolean;
}

export function HeaderBar({
  tenants,
  activeTenantId,
  onSelectTenant,
  nodeCount,
  edgeCount,
  episodeCount,
  cypherTraceCount,
  backendConnected,
  activeTab,
  onSelectTab,
  onOpenNewTenantModal,
  onResetGraph,
  isLoading,
}: HeaderBarProps) {
  const tabs = [
    {
      id: "governance" as WorkspaceTab,
      label: "Command & Governance",
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: "graph" as WorkspaceTab,
      label: "Knowledge Graph",
      icon: Network,
      badge: nodeCount > 0 ? String(nodeCount) : null,
    },
    {
      id: "memory" as WorkspaceTab,
      label: "Memory & Cypher Log",
      icon: Terminal,
      badge: cypherTraceCount > 0 ? String(cypherTraceCount) : null,
    },
    {
      id: "ingestion" as WorkspaceTab,
      label: "Company Brain & Docs",
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <header className="border-b border-slate-200 bg-white shadow-2xs z-30 font-sans">
      {/* Row 1: Brand title, connection, tenant switcher, live telemetry & tenant controls */}
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left: Brand & Connection Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-semibold tracking-tight text-slate-900">
                OmniGraph
              </span>
              <div className="h-3.5 w-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-500">
                Enterprise Governance Fabric
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center space-x-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
              }`}
            />
            <span className="text-slate-600 font-medium">
              {backendConnected ? "FalkorDB Connected" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Right: Tenant selector & counters & action triggers */}
        <div className="flex items-center gap-3">
          {/* Tenant Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tenant:
            </label>
            <select
              value={activeTenantId}
              onChange={(e) => onSelectTenant(e.target.value)}
              disabled={isLoading || tenants.length === 0}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          {/* Live Stats Pills */}
          <div className="flex items-center space-x-2.5 text-xs bg-slate-100/80 border border-slate-200 px-3 py-1 rounded-md text-slate-700">
            <div>
              <span className="text-slate-500 mr-1 text-[11px]">NODES:</span>
              <span className="text-emerald-700 font-mono font-bold">{nodeCount}</span>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              <span className="text-slate-500 mr-1 text-[11px]">EDGES:</span>
              <span className="text-blue-700 font-mono font-bold">{edgeCount}</span>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              <span className="text-slate-500 mr-1 text-[11px]">EPISODES:</span>
              <span className="text-cyan-700 font-mono font-bold">{episodeCount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onOpenNewTenantModal}
              className="flex items-center space-x-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-xs font-medium px-2.5 py-1.5 rounded-md transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>New Tenant</span>
            </button>

            <button
              onClick={onResetGraph}
              disabled={isLoading}
              className="flex items-center space-x-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-xs font-medium px-2.5 py-1.5 rounded-md transition shadow-2xs disabled:opacity-50"
              title="Reset and reseed current tenant graph"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 text-slate-500 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Centered Segmented Pill Navigation Bar */}
      <div className="h-11 bg-slate-50 border-t border-slate-200/80 px-4 flex items-center justify-center">
        <nav className="inline-flex items-center p-1 rounded-full bg-slate-200/70 border border-slate-200 shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`transition-all duration-200 rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-2 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-indigo-600" : "text-slate-500"
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
