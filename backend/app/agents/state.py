from typing import TypedDict, List, Dict, Any, Optional
from app.models.api_schemas import (
    AgentStepLog,
    CypherTraceEntry,
    PolicyEvaluationItem,
    RecalledEpisodeItem,
    WebhookDispatchResult,
    GraphDataResponse
)

class SwarmState(TypedDict):
    tenant_id: str
    session_id: str
    user_query: str
    status: str # "INITIATED", "IN_PROGRESS", "COMPLETED", "BLOCKED"
    
    # Anchored Entities
    actor_id: Optional[str]
    actor_name: Optional[str]
    actor_role: Optional[str]
    resource_id: Optional[str]
    resource_name: Optional[str]
    resource_criticality: Optional[str]

    # Investigation & Recall outputs
    blast_radius: List[Dict[str, str]]
    recalled_episodes: List[RecalledEpisodeItem]

    # Policy Governance outputs
    authority_valid: bool
    policy_passed: bool
    policies_evaluated: List[PolicyEvaluationItem]
    decision: str # "APPROVED" | "DENIED"
    rationale: str

    # Execution outputs
    webhook_result: Optional[WebhookDispatchResult]

    # Graph Traversal Telemetry
    highlighted_node_ids: List[str]
    highlighted_edge_ids: List[str]
    agent_steps: List[AgentStepLog]
    cypher_traces: List[CypherTraceEntry]
    final_graph: Optional[GraphDataResponse]
