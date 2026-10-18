from typing import List, Dict, Any
from app.db.falkor_manager import falkor_manager
from app.services.llm_extractor import llm_extractor
from app.models.api_schemas import IngestDocumentRequest, IngestDocumentResponse

class IngestionService:
    """
    Ingests unstructured/semi-structured documents, passes to schema extractor,
    compiles into parameterized MERGE OpenCypher queries, and updates FalkorDB.
    """
    def ingest_document(self, tenant_id: str, request: IngestDocumentRequest) -> IngestDocumentResponse:
        clean_tenant = tenant_id.strip().lower()
        extracted = llm_extractor.extract(
            title=request.title,
            doc_type=request.doc_type,
            raw_text=request.raw_text
        )

        tenant_graph = falkor_manager.select_tenant_graph(clean_tenant)
        queries_executed: List[str] = []

        # 1. Compile MERGE for all Nodes
        for node in extracted.nodes:
            lbl = node.label.value
            props_params: Dict[str, Any] = {
                "id": node.id,
                "name": node.name
            }
            set_clauses = ["n.name = $name"]
            for k, v in node.properties.items():
                if k not in ["id", "name"]:
                    props_params[k] = v
                    set_clauses.append(f"n.{k} = ${k}")

            set_str = ", ".join(set_clauses)
            cypher = f"MERGE (n:{lbl} {{id: $id}}) SET {set_str}"
            tenant_graph.query(cypher, props_params)
            queries_executed.append(cypher)

        # 2. Compile MERGE for all Edges
        for edge in extracted.edges:
            rel = edge.relation.value if hasattr(edge.relation, "value") else str(edge.relation)
            cypher = f"""
                MATCH (src {{id: $src_id}}), (tgt {{id: $tgt_id}})
                MERGE (src)-[r:{rel}]->(tgt)
            """
            tenant_graph.query(cypher, {
                "src_id": edge.source,
                "tgt_id": edge.target
            })
            queries_executed.append(cypher.strip())

        # 3. Ensure Provenance: Link primary entities to the uploaded source Document node
        doc_node_id = next((n.id for n in extracted.nodes if n.label.value == "Document"), None)
        if not doc_node_id:
            import re
            slug = re.sub(r"[^a-z0-9_]+", "_", request.title.lower()).strip("_")
            doc_node_id = f"doc_{slug}"
            tenant_graph.query(
                "MERGE (d:Document {id: $id}) SET d.name = $name, d.title = $title, d.doc_type = $doc_type",
                {"id": doc_node_id, "name": request.title, "title": request.title, "doc_type": request.doc_type}
            )

        # Link Policy or Resource nodes to the uploaded Document if not already linked
        for n in extracted.nodes:
            if n.label.value in ["Policy", "Resource"] and n.id != doc_node_id:
                tenant_graph.query("""
                    MATCH (src {id: $src_id}), (doc:Document {id: $doc_id})
                    MERGE (src)-[:SOURCED_FROM]->(doc)
                """, {"src_id": n.id, "doc_id": doc_node_id})

        # Remove redundant orphaned Document nodes (e.g. if LLM created both doc_orbitguard_standard_v7 and the file upload node)
        tenant_graph.query("""
            MATCH (d:Document)
            WHERE NOT (()-[:SOURCED_FROM]->(d)) AND NOT ((d)-[:SOURCED_FROM]->())
            DETACH DELETE d
        """)

        # Serialize updated graph
        graph_data = falkor_manager.serialize_tenant_graph(clean_tenant)
        doc_node_id = next((n.id for n in extracted.nodes if n.label.value == "Document"), "doc_uploaded")

        return IngestDocumentResponse(
            tenant_id=clean_tenant,
            document_id=doc_node_id,
            nodes_created=len(extracted.nodes),
            edges_created=len(extracted.edges),
            cypher_queries_executed=queries_executed,
            graph=graph_data
        )

ingestion_service = IngestionService()
