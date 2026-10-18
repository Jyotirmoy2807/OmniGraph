export type NodeLabel = "Actor" | "Group" | "Resource" | "Policy" | "Episode" | "Document";

export interface OntologyLabelMeta {
  label: NodeLabel;
  color: string;
  border_color: string;
  description: string;
}

export interface OntologyMetadataResponse {
  node_labels: OntologyLabelMeta[];
  relation_types: string[];
}

export interface TenantSummary {
  id: string;
  name: string;
  industry: string;
  description: string;
  node_count: number;
  edge_count: number;
  episode_count: number;
}

export interface PresetScenario {
  id: string;
  label: string;
  category: "AUTHORIZED" | "UNAUTHORIZED";
  query_text: string;
  expected_outcome: "APPROVED" | "DENIED";
}

export interface SampleDocument {
  id: string;
  title: string;
  doc_type: string;
  raw_text: string;
}

export interface TenantContextResponse {
  tenant: TenantSummary;
  presets: PresetScenario[];
  sample_documents: SampleDocument[];
}

export interface GraphNodeDTO {
  id: string;
  label: NodeLabel;
  name: string;
  properties: Record<string, string | number | boolean>;
  highlighted: boolean;
}

export interface GraphEdgeDTO {
  id: string;
  source: string;
  target: string;
  relation: string;
  properties: Record<string, string | number | boolean>;
  highlighted: boolean;
}

export interface GraphDataResponse {
  tenant_id: string;
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  stats: {
    node_count: number;
    edge_count: number;
    episode_count: number;
  };
}

export interface AgentStepLog {
  node_name: "TriageRouter" | "GraphInvestigator" | "PolicyGatekeeper" | "ActionExecutor";
  status: "COMPLETED" | "BLOCKED";
  summary: string;
  duration_ms: number;
}

export interface CypherTraceEntry {
  agent_node: string;
  description: string;
  cypher: string;
  params: Record<string, unknown>;
  rows_returned: number;
  execution_ms: number;
}

export interface PolicyEvaluationItem {
  policy_id: string;
  policy_name: string;
  enforcement: string;
  source_document: string;
  complies: boolean;
  reason: string;
}

export interface RecalledEpisodeItem {
  id: string;
  query: string;
  decision: string;
  rationale: string;
  timestamp: string;
}

export interface SwarmExecutionResponse {
  tenant_id: string;
  episode_id: string;
  decision: "APPROVED" | "DENIED";
  rationale: string;
  actor_resolved: { id: string; name: string; role: string } | null;
  resource_resolved: { id: string; name: string; criticality: string } | null;
  authority_path_valid: boolean;
  blast_radius_resources: Array<{ id: string; name: string; criticality: string }>;
  recalled_episodes: RecalledEpisodeItem[];
  policies_evaluated: PolicyEvaluationItem[];
  webhook_dispatch: {
    dispatched: boolean;
    target_url: string;
    http_status: number | null;
    payload: Record<string, unknown>;
    timestamp: string;
  };
  agent_steps: AgentStepLog[];
  cypher_trace: CypherTraceEntry[];
  graph: GraphDataResponse;
}

export interface IngestDocumentResponse {
  tenant_id: string;
  document_id: string;
  nodes_created: number;
  edges_created: number;
  cypher_queries_executed: string[];
  graph: GraphDataResponse;
}
