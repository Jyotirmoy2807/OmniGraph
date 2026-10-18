from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.models.ontology import NodeLabel, OntologyLabelMeta, OntologyMetadataResponse

class HealthResponse(BaseModel):
    status: str
    falkordb_connected: bool

class TenantSummary(BaseModel):
    id: str
    name: str
    industry: str
    description: str
    node_count: int
    edge_count: int
    episode_count: int

class CreateTenantRequest(BaseModel):
    id: str
    name: str
    industry: str
    description: str

class PresetScenario(BaseModel):
    id: str
    label: str
    category: str # "AUTHORIZED" | "UNAUTHORIZED"
    query_text: str
    expected_outcome: str # "APPROVED" | "DENIED"

class SampleDocument(BaseModel):
    id: str
    title: str
    doc_type: str
    raw_text: str

class TenantContextResponse(BaseModel):
    tenant: TenantSummary
    presets: List[PresetScenario]
    sample_documents: List[SampleDocument]

class GraphNodeDTO(BaseModel):
    id: str
    label: NodeLabel
    name: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    highlighted: bool = False

class GraphEdgeDTO(BaseModel):
    id: str
    source: str
    target: str
    relation: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    highlighted: bool = False

class GraphStats(BaseModel):
    node_count: int
    edge_count: int
    episode_count: int

class GraphDataResponse(BaseModel):
    tenant_id: str
    nodes: List[GraphNodeDTO]
    edges: List[GraphEdgeDTO]
    stats: GraphStats

class IngestDocumentRequest(BaseModel):
    title: str
    doc_type: str = "markdown" # markdown, txt, csv, json
    raw_text: str

class IngestDocumentResponse(BaseModel):
    tenant_id: str
    document_id: str
    nodes_created: int
    edges_created: int
    cypher_queries_executed: List[str]
    graph: GraphDataResponse

class AgentStepLog(BaseModel):
    node_name: str # "TriageRouter" | "GraphInvestigator" | "PolicyGatekeeper" | "ActionExecutor"
    status: str # "COMPLETED" | "BLOCKED"
    summary: str
    duration_ms: float

class CypherTraceEntry(BaseModel):
    agent_node: str
    description: str
    cypher: str
    params: Dict[str, Any] = Field(default_factory=dict)
    rows_returned: int
    execution_ms: float

class PolicyEvaluationItem(BaseModel):
    policy_id: str
    policy_name: str
    enforcement: str
    source_document: str
    complies: bool
    reason: str

class RecalledEpisodeItem(BaseModel):
    id: str
    query: str
    decision: str
    rationale: str
    timestamp: str

class WebhookDispatchResult(BaseModel):
    dispatched: bool
    target_url: str
    http_status: Optional[int] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str

class SwarmExecutionRequest(BaseModel):
    query: str

class SwarmExecutionResponse(BaseModel):
    tenant_id: str
    episode_id: str
    decision: str # "APPROVED" | "DENIED"
    rationale: str
    actor_resolved: Optional[Dict[str, str]] = None
    resource_resolved: Optional[Dict[str, str]] = None
    authority_path_valid: bool
    blast_radius_resources: List[Dict[str, str]] = Field(default_factory=list)
    recalled_episodes: List[RecalledEpisodeItem] = Field(default_factory=list)
    policies_evaluated: List[PolicyEvaluationItem] = Field(default_factory=list)
    webhook_dispatch: WebhookDispatchResult
    agent_steps: List[AgentStepLog] = Field(default_factory=list)
    cypher_trace: List[CypherTraceEntry] = Field(default_factory=list)
    graph: GraphDataResponse
