import time
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.agents.state import SwarmState
from app.agents.tools import swarm_tools
from app.db.falkor_manager import falkor_manager
from app.services.webhook_service import webhook_service
from app.models.api_schemas import AgentStepLog

def triage_router_node(state: SwarmState) -> Dict[str, Any]:
    start_time = time.perf_counter()
    tenant_id = state["tenant_id"]
    query = state["user_query"]
    session_id = state["session_id"]
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Anchor Actor & Resource
    actor, resource, anchor_traces = swarm_tools.anchor_entities(tenant_id, query)
    
    actor_id = actor["id"] if actor else None
    actor_name = actor["name"] if actor else None
    actor_role = actor["role"] if actor else None

    resource_id = resource["id"] if resource else None
    resource_name = resource["name"] if resource else None
    resource_criticality = resource["criticality"] if resource else None

    # 2. In-Graph Episodic Memory: Create Episode Node
    g = falkor_manager.select_tenant_graph(tenant_id)
    g.query("""
        MERGE (ep:Episode {id: $session_id})
        SET ep.query = $query,
            ep.decision = 'IN_PROGRESS',
            ep.timestamp = $timestamp
    """, {"session_id": session_id, "query": query, "timestamp": now_iso})

    # Link Episode to Actor if anchored
    if actor_id:
        g.query("""
            MATCH (ep:Episode {id: $session_id}), (a:Actor {id: $actor_id})
            MERGE (ep)-[:INITIATED_BY]->(a)
        """, {"session_id": session_id, "actor_id": actor_id})

    # 3. Cross-Session Memory Recall
    recalled_episodes = []
    if resource_id:
        recalled_episodes, recall_trace = swarm_tools.recall_episodes(tenant_id, resource_id, session_id)
        anchor_traces.append(recall_trace)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    step_log = AgentStepLog(
        node_name="TriageRouter",
        status="COMPLETED",
        summary=f"Anchored actor '{actor_name}' and resource '{resource_name}'. Recalled {len(recalled_episodes)} historical episodes.",
        duration_ms=elapsed_ms
    )

    highlighted = [session_id]
    if actor_id:
        highlighted.append(actor_id)
    if resource_id:
        highlighted.append(resource_id)

    return {
        "status": "IN_PROGRESS",
        "actor_id": actor_id,
        "actor_name": actor_name,
        "actor_role": actor_role,
        "resource_id": resource_id,
        "resource_name": resource_name,
        "resource_criticality": resource_criticality,
        "recalled_episodes": recalled_episodes,
        "highlighted_node_ids": list(set(state.get("highlighted_node_ids", []) + highlighted)),
        "agent_steps": state.get("agent_steps", []) + [step_log],
        "cypher_traces": state.get("cypher_traces", []) + anchor_traces
    }

def graph_investigator_node(state: SwarmState) -> Dict[str, Any]:
    start_time = time.perf_counter()
    tenant_id = state["tenant_id"]
    session_id = state["session_id"]
    resource_id = state.get("resource_id")
    traces = []
    blast_radius = []
    highlighted_nodes = []

    if resource_id:
        blast_radius, node_ids, _, trace = swarm_tools.compute_blast_radius(tenant_id, resource_id)
        traces.append(trace)
        highlighted_nodes.extend(node_ids)

        # Write in-graph episodic memory edges: (:Episode)-[:IMPACTS]->(:Resource)
        g = falkor_manager.select_tenant_graph(tenant_id)
        for res_item in [resource_id] + [x["id"] for x in blast_radius]:
            g.query("""
                MATCH (ep:Episode {id: $session_id}), (r:Resource {id: $res_id})
                MERGE (ep)-[:IMPACTS]->(r)
            """, {"session_id": session_id, "res_id": res_item})

        # Handoff edge in graph memory
        g.query("""
            MATCH (ep:Episode {id: $session_id})
            SET ep.handed_off_to = 'PolicyGatekeeper'
        """, {"session_id": session_id})

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    step_log = AgentStepLog(
        node_name="GraphInvestigator",
        status="COMPLETED",
        summary=f"Investigated dependency graph. Discovered {len(blast_radius)} impacted dependent assets.",
        duration_ms=elapsed_ms
    )

    return {
        "blast_radius": blast_radius,
        "highlighted_node_ids": list(set(state.get("highlighted_node_ids", []) + highlighted_nodes)),
        "agent_steps": state.get("agent_steps", []) + [step_log],
        "cypher_traces": state.get("cypher_traces", []) + traces
    }

def policy_gatekeeper_node(state: SwarmState) -> Dict[str, Any]:
    start_time = time.perf_counter()
    tenant_id = state["tenant_id"]
    session_id = state["session_id"]
    actor_id = state.get("actor_id")
    resource_id = state.get("resource_id")
    traces = []
    highlighted_nodes = []

    if not actor_id or not resource_id:
        has_auth_path = False
        passed = False
        policies_list = []
        rationale = "Execution blocked: Could not anchor required Actor or Target Resource in knowledge graph."
    else:
        has_auth_path, passed, policies_list, trav_nodes, trace = swarm_tools.verify_governance(
            tenant_id, actor_id, resource_id
        )
        traces.append(trace)
        highlighted_nodes.extend(trav_nodes)

        # Write evaluated policy edges into Episode in graph memory
        g = falkor_manager.select_tenant_graph(tenant_id)
        for pol_item in policies_list:
            g.query("""
                MATCH (ep:Episode {id: $session_id}), (p:Policy {id: $pol_id})
                MERGE (ep)-[:EVALUATED_POLICY {complies: $complies}]->(p)
            """, {
                "session_id": session_id,
                "pol_id": pol_item.policy_id,
                "complies": pol_item.complies
            })

        if passed:
            rationale = "Governance verified: Direct ownership/hierarchy path established and 100% of governing policies verified compliant."
        elif not has_auth_path:
            rationale = f"Authorization denied: Actor '{state.get('actor_name')}' lacks organizational ownership/management hierarchy to '{state.get('resource_name')}'."
        else:
            rationale = "Policy block: One or more required governance policies failed compliance verification."

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    step_log = AgentStepLog(
        node_name="PolicyGatekeeper",
        status="COMPLETED" if passed else "BLOCKED",
        summary=f"Policy gatekeeper evaluated {len(policies_list)} governance policies. Authority path: {has_auth_path}. Overall passed: {passed}.",
        duration_ms=elapsed_ms
    )

    return {
        "authority_valid": has_auth_path,
        "policy_passed": passed,
        "policies_evaluated": policies_list,
        "decision": "APPROVED" if passed else "DENIED",
        "rationale": rationale,
        "highlighted_node_ids": list(set(state.get("highlighted_node_ids", []) + highlighted_nodes)),
        "agent_steps": state.get("agent_steps", []) + [step_log],
        "cypher_traces": state.get("cypher_traces", []) + traces
    }

def action_executor_node(state: SwarmState) -> Dict[str, Any]:
    start_time = time.perf_counter()
    tenant_id = state["tenant_id"]
    session_id = state["session_id"]
    actor_id = state.get("actor_id") or "UNKNOWN_ACTOR"
    resource_id = state.get("resource_id") or "UNKNOWN_RESOURCE"
    passed = state.get("policy_passed", False)
    decision = state.get("decision", "DENIED")
    rationale = state.get("rationale", "")

    # In-Graph Episodic Memory: Update Episode Node with final decision and rationale
    g = falkor_manager.select_tenant_graph(tenant_id)
    g.query("""
        MATCH (ep:Episode {id: $session_id})
        SET ep.decision = $decision,
            ep.rationale = $rationale
    """, {"session_id": session_id, "decision": decision, "rationale": rationale})

    webhook_res = None
    if passed:
        webhook_res = webhook_service.dispatch_action(
            tenant_id=tenant_id,
            episode_id=session_id,
            actor_id=actor_id,
            resource_id=resource_id
        )

    # Serialize complete tenant graph with path highlighted
    highlighted_set = set(state.get("highlighted_node_ids", []))
    final_graph = falkor_manager.serialize_tenant_graph(tenant_id, highlighted_node_ids=highlighted_set)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    step_log = AgentStepLog(
        node_name="ActionExecutor",
        status="COMPLETED" if passed else "BLOCKED",
        summary=f"Action execution: {decision}. External webhook dispatched: {passed}.",
        duration_ms=elapsed_ms
    )

    return {
        "status": "COMPLETED",
        "webhook_result": webhook_res,
        "final_graph": final_graph,
        "agent_steps": state.get("agent_steps", []) + [step_log]
    }
