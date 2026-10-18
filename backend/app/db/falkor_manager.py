import time
from typing import Dict, Any, List, Set, Optional, Tuple
from falkordb import FalkorDB, Graph
from app.config import settings
from app.models.api_schemas import GraphDataResponse, GraphNodeDTO, GraphEdgeDTO, GraphStats, CypherTraceEntry
from app.models.ontology import NodeLabel

class FalkorManager:
    """
    Manages FalkorDB connections, multigraph selection, safe querying,
    and automatic serialization into React Flow compatible DTOs.
    """
    def __init__(self):
        self._client: Optional[FalkorDB] = None

    @property
    def client(self) -> FalkorDB:
        if self._client is None:
            self._client = FalkorDB(
                host=settings.FALKORDB_HOST,
                port=settings.FALKORDB_PORT,
                username=settings.FALKORDB_USERNAME or None,
                password=settings.FALKORDB_PASSWORD or None,
            )
        return self._client

    def select_graph(self, graph_name: str) -> Graph:
        return self.client.select_graph(graph_name)

    def select_tenant_graph(self, tenant_id: str) -> Graph:
        clean_id = tenant_id.strip().lower()
        if not clean_id.startswith("tenant_"):
            clean_id = f"tenant_{clean_id}"
        return self.client.select_graph(clean_id)

    def select_registry_graph(self) -> Graph:
        return self.client.select_graph("omnigraph_registry")

    def query_with_trace(
        self,
        graph: Graph,
        cypher: str,
        params: Optional[Dict[str, Any]] = None,
        agent_node: str = "System",
        description: str = "Query execution"
    ) -> Tuple[Any, CypherTraceEntry]:
        params = params or {}
        start_time = time.perf_counter()
        result = graph.query(cypher, params)
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        rows_count = len(result.result_set) if result and hasattr(result, "result_set") else 0
        trace = CypherTraceEntry(
            agent_node=agent_node,
            description=description,
            cypher=cypher.strip(),
            params=params,
            rows_returned=rows_count,
            execution_ms=elapsed_ms
        )
        return result, trace

    def check_connection(self) -> bool:
        try:
            reg = self.select_registry_graph()
            reg.query("RETURN 1")
            return True
        except Exception:
            return False

    def serialize_tenant_graph(
        self,
        tenant_id: str,
        highlighted_node_ids: Optional[Set[str]] = None,
        highlighted_edge_ids: Optional[Set[str]] = None
    ) -> GraphDataResponse:
        highlighted_node_ids = highlighted_node_ids or set()
        highlighted_edge_ids = highlighted_edge_ids or set()

        tenant_graph = self.select_tenant_graph(tenant_id)
        
        # Query all nodes and edges
        res = tenant_graph.query("""
            MATCH (n)
            OPTIONAL MATCH (n)-[r]->(m)
            RETURN n, r, m
        """)

        nodes_dict: Dict[str, GraphNodeDTO] = {}
        edges_dict: Dict[str, GraphEdgeDTO] = {}
        episode_count = 0

        if res and hasattr(res, "result_set"):
            for row in res.result_set:
                n = row[0]
                r = row[1] if len(row) > 1 else None
                m = row[2] if len(row) > 2 else None

                for node_obj in [n, m]:
                    if node_obj is not None:
                        props = dict(getattr(node_obj, "properties", {}))
                        node_id = str(props.get("id") or getattr(node_obj, "id", ""))
                        
                        labels = getattr(node_obj, "labels", [])
                        label_str = labels[0] if labels else "Resource"
                        # Standardize to valid NodeLabel
                        valid_label = NodeLabel.RESOURCE
                        for l in NodeLabel:
                            if l.value.lower() == label_str.lower():
                                valid_label = l
                                break

                        name_val = str(props.get("name") or props.get("title") or props.get("query") or node_id)
                        
                        if node_id not in nodes_dict:
                            nodes_dict[node_id] = GraphNodeDTO(
                                id=node_id,
                                label=valid_label,
                                name=name_val,
                                properties=props,
                                highlighted=(node_id in highlighted_node_ids)
                            )
                            if valid_label == NodeLabel.EPISODE:
                                episode_count += 1

                if r is not None and n is not None and m is not None:
                    n_props = dict(getattr(n, "properties", {}))
                    m_props = dict(getattr(m, "properties", {}))
                    src_id = str(n_props.get("id") or getattr(n, "id", ""))
                    tgt_id = str(m_props.get("id") or getattr(m, "id", ""))
                    
                    r_rel = getattr(r, "relation", "RELATED_TO")
                    r_props = dict(getattr(r, "properties", {}))
                    
                    # Compute unique edge key
                    edge_id = f"{src_id}-{r_rel}-{tgt_id}"
                    if edge_id not in edges_dict:
                        edges_dict[edge_id] = GraphEdgeDTO(
                            id=edge_id,
                            source=src_id,
                            target=tgt_id,
                            relation=r_rel,
                            properties=r_props,
                            highlighted=(
                                edge_id in highlighted_edge_ids or
                                (src_id in highlighted_node_ids and tgt_id in highlighted_node_ids)
                            )
                        )

        return GraphDataResponse(
            tenant_id=tenant_id,
            nodes=list(nodes_dict.values()),
            edges=list(edges_dict.values()),
            stats=GraphStats(
                node_count=len(nodes_dict),
                edge_count=len(edges_dict),
                episode_count=episode_count
            )
        )

falkor_manager = FalkorManager()
