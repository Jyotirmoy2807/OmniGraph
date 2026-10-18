import {
  OntologyMetadataResponse,
  TenantSummary,
  TenantContextResponse,
  GraphDataResponse,
  SwarmExecutionResponse,
  IngestDocumentResponse,
} from "../types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error [${res.status}]: ${errorText}`);
  }

  return res.json();
}

export const apiClient = {
  getHealth: () => request<{ status: string; falkordb_connected: boolean }>("/health"),
  getOntology: () => request<OntologyMetadataResponse>("/ontology"),
  getTenants: () => request<TenantSummary[]>("/tenants"),
  createTenant: (data: { id: string; name: string; industry: string; description: string }) =>
    request<TenantSummary>("/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTenantContext: (tenantId: string) =>
    request<TenantContextResponse>(`/tenants/${encodeURIComponent(tenantId)}/context`),
  getTenantGraph: (tenantId: string) =>
    request<GraphDataResponse>(`/tenants/${encodeURIComponent(tenantId)}/graph`),
  resetTenant: (tenantId: string) =>
    request<{ status: string; tenant_id: string; message: string }>(
      `/tenants/${encodeURIComponent(tenantId)}/reset`,
      { method: "POST" }
    ),
  ingestDocument: (
    tenantId: string,
    data: { title: string; doc_type: string; raw_text: string }
  ) =>
    request<IngestDocumentResponse>(`/tenants/${encodeURIComponent(tenantId)}/ingest`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  executeAgentSwarm: (tenantId: string, query: string) =>
    request<SwarmExecutionResponse>(
      `/tenants/${encodeURIComponent(tenantId)}/agent/execute`,
      {
        method: "POST",
        body: JSON.stringify({ query }),
      }
    ),
};
