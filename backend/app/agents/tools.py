from typing import Tuple, Optional, Dict, Any, List
from app.db.falkor_manager import falkor_manager
from app.models.api_schemas import CypherTraceEntry, RecalledEpisodeItem, PolicyEvaluationItem
from app.db.cypher_templates import (
    ANCHOR_ACTOR_QUERY,
    ANCHOR_RESOURCE_QUERY,
    BLAST_RADIUS_QUERY,
    GOVERNANCE_CHECK_QUERY,
    CROSS_SESSION_EPISODE_QUERY
)

class SwarmTools:
    """
    Deterministic FalkorDB graph tools:
    1. Entity Anchoring (fuzzy token match against canonical nodes)
    2. Blast Radius traversal (bounded variable-length path)
    3. Multi-Hop fail-closed governance verification
    4. Cross-session episodic memory recall
    """

    @staticmethod
    def anchor_entities(tenant_id: str, query: str) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], List[CypherTraceEntry]]:
        g = falkor_manager.select_tenant_graph(tenant_id)
        traces: List[CypherTraceEntry] = []
        q_lower = query.lower()

        # 1. Fetch all Actors
        res_actors, trace_a = falkor_manager.query_with_trace(
            g, ANCHOR_ACTOR_QUERY, agent_node="TriageRouter", description="Fetch canonical actors for anchoring"
        )
        traces.append(trace_a)

        matched_actor = None
        if res_actors and res_actors.result_set:
            best_score = 0
            for row in res_actors.result_set:
                a_id, a_name, a_role, a_dept, a_clearance = row[0], row[1], row[2], row[3], row[4]
                name_words = [w.lower() for w in str(a_name).split() if len(w) > 2]
                score = sum(1 for w in name_words if w in q_lower)
                if score > best_score:
                    best_score = score
                    matched_actor = {
                        "id": str(a_id),
                        "name": str(a_name),
                        "role": str(a_role),
                        "department": str(a_dept),
                        "clearance_level": str(a_clearance)
                    }

        # 2. Fetch all Resources
        res_res, trace_r = falkor_manager.query_with_trace(
            g, ANCHOR_RESOURCE_QUERY, agent_node="TriageRouter", description="Fetch canonical resources for anchoring"
        )
        traces.append(trace_r)

        matched_resource = None
        if res_res and res_res.result_set:
            best_r_score = 0
            for row in res_res.result_set:
                r_id, r_name, r_type, r_crit, r_stat = row[0], row[1], row[2], row[3], row[4]
                name_words = [w.lower() for w in str(r_name).split() if len(w) > 2]
                score = sum(1 for w in name_words if w in q_lower)
                if score > best_r_score:
                    best_r_score = score
                    matched_resource = {
                        "id": str(r_id),
                        "name": str(r_name),
                        "resource_type": str(r_type),
                        "criticality": str(r_crit),
                        "status": str(r_stat)
                    }

        return matched_actor, matched_resource, traces

    @staticmethod
    def recall_episodes(tenant_id: str, resource_id: str, current_episode_id: str) -> Tuple[List[RecalledEpisodeItem], CypherTraceEntry]:
        g = falkor_manager.select_tenant_graph(tenant_id)
        result, trace = falkor_manager.query_with_trace(
            g,
            CROSS_SESSION_EPISODE_QUERY,
            {"resource_id": resource_id, "current_episode_id": current_episode_id},
            agent_node="TriageRouter",
            description="Recall historical episodes connected to resource"
        )

        recalled = []
        if result and result.result_set:
            for row in result.result_set:
                ep_obj = row[0]
                if ep_obj:
                    props = dict(getattr(ep_obj, "properties", {}))
                    recalled.append(RecalledEpisodeItem(
                        id=str(props.get("id") or getattr(ep_obj, "id", "")),
                        query=str(props.get("query") or ""),
                        decision=str(props.get("decision") or ""),
                        rationale=str(props.get("rationale") or ""),
                        timestamp=str(props.get("timestamp") or "")
                    ))

        return recalled, trace

    @staticmethod
    def compute_blast_radius(tenant_id: str, resource_id: str) -> Tuple[List[Dict[str, str]], List[str], List[str], CypherTraceEntry]:
        g = falkor_manager.select_tenant_graph(tenant_id)
        result, trace = falkor_manager.query_with_trace(
            g,
            BLAST_RADIUS_QUERY,
            {"resource_id": resource_id},
            agent_node="GraphInvestigator",
            description="Traverse downstream dependency paths (blast radius)"
        )

        impacted: List[Dict[str, str]] = []
        node_ids: List[str] = [resource_id]
        edge_ids: List[str] = []

        if result and result.result_set:
            for row in result.result_set:
                dependent = row[1]
                dep_rel = row[2]
                owner = row[3]
                own_rel = row[4]

                if dependent:
                    d_props = dict(getattr(dependent, "properties", {}))
                    d_id = str(d_props.get("id") or getattr(dependent, "id", ""))
                    d_name = str(d_props.get("name") or d_id)
                    d_crit = str(d_props.get("criticality") or "UNKNOWN")
                    if d_id not in [x["id"] for x in impacted] and d_id != resource_id:
                        impacted.append({"id": d_id, "name": d_name, "criticality": d_crit})
                    node_ids.append(d_id)

                if dep_rel:
                    # Variable length path may return single relation or list
                    rels = dep_rel if isinstance(dep_rel, list) else [dep_rel]
                    for r in rels:
                        r_type = getattr(r, "relation", "DEPENDS_ON")
                        edge_ids.append(f"-{r_type}-")

                if owner:
                    o_props = dict(getattr(owner, "properties", {}))
                    o_id = str(o_props.get("id") or getattr(owner, "id", ""))
                    node_ids.append(o_id)

        return impacted, list(set(node_ids)), edge_ids, trace

    @staticmethod
    def verify_governance(tenant_id: str, actor_id: str, resource_id: str) -> Tuple[bool, bool, List[PolicyEvaluationItem], List[str], CypherTraceEntry]:
        g = falkor_manager.select_tenant_graph(tenant_id)
        result, trace = falkor_manager.query_with_trace(
            g,
            GOVERNANCE_CHECK_QUERY,
            {"actor_id": actor_id, "resource_id": resource_id},
            agent_node="PolicyGatekeeper",
            description="Multi-hop authority and policy compliance verification"
        )

        has_auth_path = False
        policies_map: Dict[str, PolicyEvaluationItem] = {}
        traversed_node_ids: List[str] = [actor_id, resource_id]

        if result and result.result_set:
            for row in result.result_set:
                auth_rel = row[2]
                auth_target = row[3]
                gov_rel = row[4]
                pol = row[5]
                comp_rel = row[6]
                src_rel = row[7]
                doc = row[8]

                if auth_rel or (auth_target is not None):
                    has_auth_path = True
                    if auth_target:
                        at_props = dict(getattr(auth_target, "properties", {}))
                        traversed_node_ids.append(str(at_props.get("id") or ""))

                if pol is not None:
                    p_props = dict(getattr(pol, "properties", {}))
                    p_id = str(p_props.get("id") or getattr(pol, "id", ""))
                    p_name = str(p_props.get("name") or p_id)
                    p_enf = str(p_props.get("enforcement") or "FAIL_CLOSED")
                    traversed_node_ids.append(p_id)

                    doc_name = "N/A"
                    if doc is not None:
                        d_props = dict(getattr(doc, "properties", {}))
                        doc_name = str(d_props.get("title") or "Source Doc")
                        traversed_node_ids.append(str(d_props.get("id") or ""))

                    complies = comp_rel is not None
                    reason = "Compliance verified via active [:COMPLIES_WITH] edge" if complies else "Missing required [:COMPLIES_WITH] compliance edge for governing policy"

                    policies_map[p_id] = PolicyEvaluationItem(
                        policy_id=p_id,
                        policy_name=p_name,
                        enforcement=p_enf,
                        source_document=doc_name,
                        complies=complies,
                        reason=reason
                    )

        policies_list = list(policies_map.values())
        all_policies_comply = len(policies_list) > 0 and all(p.complies for p in policies_list)
        overall_passed = has_auth_path and all_policies_comply

        return has_auth_path, overall_passed, policies_list, list(set(traversed_node_ids)), trace

swarm_tools = SwarmTools()
