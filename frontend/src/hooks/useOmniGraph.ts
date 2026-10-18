"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TenantSummary,
  TenantContextResponse,
  OntologyMetadataResponse,
  GraphDataResponse,
  SwarmExecutionResponse,
  GraphNodeDTO,
} from "../types/api";
import { apiClient } from "../lib/apiClient";

export function useOmniGraph() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>("");
  const [tenantContext, setTenantContext] = useState<TenantContextResponse | null>(null);
  const [ontology, setOntology] = useState<OntologyMetadataResponse | null>(null);
  const [graphData, setGraphData] = useState<GraphDataResponse | null>(null);
  const [swarmResult, setSwarmResult] = useState<SwarmExecutionResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNodeDTO | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSwarmRunning, setIsSwarmRunning] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check health and initialize registry + ontology
  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const health = await apiClient.getHealth();
      setBackendHealth(health.falkordb_connected);

      const [ontoRes, tenantsRes] = await Promise.all([
        apiClient.getOntology(),
        apiClient.getTenants(),
      ]);

      setOntology(ontoRes);
      setTenants(tenantsRes);

      if (tenantsRes.length > 0) {
        setActiveTenantId(tenantsRes[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setBackendHealth(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch tenant-specific context & graph when tenant changes
  const loadTenant = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    setIsLoading(true);
    setError(null);
    setSwarmResult(null);
    setSelectedNode(null);

    try {
      const [ctx, graph] = await Promise.all([
        apiClient.getTenantContext(tenantId),
        apiClient.getTenantGraph(tenantId),
      ]);
      setTenantContext(ctx);
      setGraphData(graph);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (activeTenantId) {
      loadTenant(activeTenantId);
    }
  }, [activeTenantId, loadTenant]);

  const executeSwarmQuery = async (query: string) => {
    if (!activeTenantId || !query.trim()) return;
    setIsSwarmRunning(true);
    setError(null);

    try {
      const result = await apiClient.executeAgentSwarm(activeTenantId, query);
      setSwarmResult(result);
      if (result.graph) {
        setGraphData(result.graph);
      }
      // Update tenant counts
      const updatedCtx = await apiClient.getTenantContext(activeTenantId);
      setTenantContext(updatedCtx);
      const updatedTenants = await apiClient.getTenants();
      setTenants(updatedTenants);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSwarmRunning(false);
    }
  };

  const resetCurrentGraph = async () => {
    if (!activeTenantId) return;
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.resetTenant(activeTenantId);
      await loadTenant(activeTenantId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const createTenant = async (id: string, name: string, industry: string, description: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newT = await apiClient.createTenant({ id, name, industry, description });
      const updatedTenants = await apiClient.getTenants();
      setTenants(updatedTenants);
      setActiveTenantId(newT.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    refreshCurrentTenant: () => loadTenant(activeTenantId),
  };
}
