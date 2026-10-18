"use client";

import React, { useState } from "react";
import { useOmniGraph } from "../hooks/useOmniGraph";
import { HeaderBar } from "../components/HeaderBar";
import { OperationsConsole } from "../components/OperationsConsole";
import { GovernanceAuditPanel } from "../components/GovernanceAuditPanel";
import { GraphViewport } from "../components/GraphViewport";
import { MemoryCypherTab } from "../components/MemoryCypherTab";
import { CompanyBrainDocsTab } from "../components/CompanyBrainDocsTab";
import { CreateTenantModal } from "../components/CreateTenantModal";
import { IngestionModal } from "../components/IngestionModal";
import { WorkspaceTab } from "../types/tabs";

export default function WorkspacePage() {
  const {
    tenants,
    activeTenantId,
    setActiveTenantId,
    tenantContext,
    ontology,
    graphData,
    swarmResult,
    selectedNode,
    setSelectedNode,
    isLoading,
    isSwarmRunning,
    backendHealth,
    error,
    executeSwarmQuery,
    resetCurrentGraph,
    createTenant,
    refreshCurrentTenant,
  } = useOmniGraph();

  // Top-level Segmented Tab State (Shared & Persistent)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("governance");
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* 1. Two-Row Header with Centered Segmented Pill Bar */}
      <HeaderBar
        tenants={tenants}
        activeTenantId={activeTenantId}
        onSelectTenant={setActiveTenantId}
        nodeCount={graphData?.stats.node_count || 0}
        edgeCount={graphData?.stats.edge_count || 0}
        episodeCount={graphData?.stats.episode_count || 0}
        cypherTraceCount={swarmResult?.cypher_trace?.length || 0}
        backendConnected={backendHealth}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewTenantModal={() => setIsNewTenantModalOpen(true)}
        onResetGraph={resetCurrentGraph}
        isLoading={isLoading}
      />

      {/* Global Error toast if backend fails */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2 text-xs flex items-center justify-between font-medium">
          <span>{error}</span>
        </div>
      )}

      {/* 2. Main Tabbed Workspace Panels (Zero Overlapping Drawers) */}
      <main className="flex-1 relative overflow-hidden bg-slate-50">
        {/* TAB 1: Command & Governance (Spacious 2-Column Grid) */}
        {activeTab === "governance" && (
          <div className="grid grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] overflow-hidden font-sans">
            {/* Left Column (5 Cols): Scenarios, Custom Request, Execution Pipeline */}
            <div className="col-span-5 flex flex-col gap-5 overflow-y-auto pr-2">
              <OperationsConsole
                presets={tenantContext?.presets || []}
                onExecuteQuery={executeSwarmQuery}
                isSwarmRunning={isSwarmRunning}
                agentSteps={swarmResult?.agent_steps || []}
              />
            </div>

            {/* Right Column (7 Cols): Prominent Verdict Banner, Entities, Blast Radius, Policies */}
            <div className="col-span-7 flex flex-col gap-5 overflow-y-auto pl-2">
              <GovernanceAuditPanel
                result={swarmResult}
                graphData={graphData}
                ontology={ontology}
                selectedNode={selectedNode}
                onClearSelectedNode={() => setSelectedNode(null)}
                onNavigateToGraph={() => setActiveTab("graph")}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Knowledge Graph (100% Full-Screen Canvas, Auto-Fit, Zero Clipping) */}
        {activeTab === "graph" && (
          <div className="relative w-full h-[calc(100vh-100px)] bg-slate-50">
            <GraphViewport
              graphData={graphData}
              ontology={ontology}
              onNodeClick={setSelectedNode}
              decisionOutcome={swarmResult?.decision}
              selectedNode={selectedNode}
              onClearSelectedNode={() => setSelectedNode(null)}
              isActiveTab={activeTab === "graph"}
            />
          </div>
        )}

        {/* TAB 3: Memory & Cypher Telemetry (Dedicated Track 2 & Cypher Log) */}
        {activeTab === "memory" && (
          <MemoryCypherTab
            recalledEpisodes={swarmResult?.recalled_episodes || []}
            graphData={graphData}
            cypherTraces={swarmResult?.cypher_trace || []}
          />
        )}

        {/* TAB 4: Company Brain & Docs (In-Page Ingestion Studio & Provenance) */}
        {activeTab === "ingestion" && (
          <CompanyBrainDocsTab
            tenantId={activeTenantId}
            sampleDocuments={tenantContext?.sample_documents || []}
            ontology={ontology}
            graphData={graphData}
            onIngestionSuccess={refreshCurrentTenant}
          />
        )}
      </main>

      {/* 3. Modals */}
      <CreateTenantModal
        isOpen={isNewTenantModalOpen}
        onClose={() => setIsNewTenantModalOpen(false)}
        onCreateTenant={createTenant}
      />

      <IngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        tenantId={activeTenantId}
        sampleDocuments={tenantContext?.sample_documents || []}
        onIngestionSuccess={refreshCurrentTenant}
      />
    </div>
  );
}
