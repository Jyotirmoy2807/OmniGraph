import uuid
from typing import Dict, Any
from langgraph.graph import StateGraph, START, END
from app.agents.state import SwarmState
from app.agents.nodes import (
    triage_router_node,
    graph_investigator_node,
    policy_gatekeeper_node,
    action_executor_node
)
from app.models.api_schemas import SwarmExecutionResponse, WebhookDispatchResult

def build_swarm_workflow():
    builder = StateGraph(SwarmState)

    builder.add_node("TriageRouter", triage_router_node)
    builder.add_node("GraphInvestigator", graph_investigator_node)
    builder.add_node("PolicyGatekeeper", policy_gatekeeper_node)
    builder.add_node("ActionExecutor", action_executor_node)

    builder.add_edge(START, "TriageRouter")
    builder.add_edge("TriageRouter", "GraphInvestigator")
    builder.add_edge("GraphInvestigator", "PolicyGatekeeper")
    builder.add_edge("PolicyGatekeeper", "ActionExecutor")
    builder.add_edge("ActionExecutor", END)

    return builder.compile()

compiled_swarm = build_swarm_workflow()

def run_swarm(tenant_id: str, query: str) -> SwarmExecutionResponse:
    episode_id = f"ep_{uuid.uuid4().hex[:8]}"
    initial_state: SwarmState = {
        "tenant_id": tenant_id,
        "session_id": episode_id,
        "user_query": query,
        "status": "INITIATED",
        "actor_id": None,
        "actor_name": None,
        "actor_role": None,
        "resource_id": None,
        "resource_name": None,
        "resource_criticality": None,
        "blast_radius": [],
        "recalled_episodes": [],
        "authority_valid": False,
        "policy_passed": False,
        "policies_evaluated": [],
        "decision": "DENIED",
        "rationale": "Pending swarm evaluation.",
        "webhook_result": None,
        "highlighted_node_ids": [],
        "highlighted_edge_ids": [],
        "agent_steps": [],
        "cypher_traces": [],
        "final_graph": None
    }

    final_state = compiled_swarm.invoke(initial_state)

    wh = final_state.get("webhook_result")
    if not wh:
        wh = WebhookDispatchResult(
            dispatched=False,
            target_url="",
            http_status=None,
            payload={},
            timestamp=""
        )

    actor_info = None
    if final_state.get("actor_id"):
        actor_info = {
            "id": final_state["actor_id"],
            "name": final_state.get("actor_name") or "",
            "role": final_state.get("actor_role") or ""
        }

    res_info = None
    if final_state.get("resource_id"):
        res_info = {
            "id": final_state["resource_id"],
            "name": final_state.get("resource_name") or "",
            "criticality": final_state.get("resource_criticality") or ""
        }

    return SwarmExecutionResponse(
        tenant_id=tenant_id,
        episode_id=episode_id,
        decision=final_state.get("decision", "DENIED"),
        rationale=final_state.get("rationale", ""),
        actor_resolved=actor_info,
        resource_resolved=res_info,
        authority_path_valid=final_state.get("authority_valid", False),
        blast_radius_resources=final_state.get("blast_radius", []),
        recalled_episodes=final_state.get("recalled_episodes", []),
        policies_evaluated=final_state.get("policies_evaluated", []),
        webhook_dispatch=wh,
        agent_steps=final_state.get("agent_steps", []),
        cypher_trace=final_state.get("cypher_traces", []),
        graph=final_state["final_graph"]
    )
