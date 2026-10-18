from datetime import datetime, timezone
from typing import List, Optional
from app.db.falkor_manager import falkor_manager
from app.models.api_schemas import TenantSummary, TenantContextResponse, PresetScenario, SampleDocument

class RegistryService:
    """
    Manages dynamic tenant metadata, preset evaluation scenarios, and
    sample ingestion documents stored inside the FalkorDB omnigraph_registry graph.
    """
    def get_all_tenants(self) -> List[TenantSummary]:
        reg_graph = falkor_manager.select_registry_graph()
        result = reg_graph.query("""
            MATCH (t:Tenant)
            RETURN t.id AS id, t.name AS name, t.industry AS industry, t.description AS description, t.created_at AS created_at
            ORDER BY t.created_at ASC
        """)

        tenants: List[TenantSummary] = []
        if result and hasattr(result, "result_set"):
            for row in result.result_set:
                t_id = str(row[0])
                t_name = str(row[1])
                t_industry = str(row[2])
                t_desc = str(row[3])
                
                # Fetch live counts from tenant graph
                try:
                    t_graph = falkor_manager.select_tenant_graph(t_id)
                    n_res = t_graph.query("MATCH (n) RETURN count(n) AS c")
                    node_cnt = int(n_res.result_set[0][0]) if n_res and n_res.result_set else 0

                    e_res = t_graph.query("MATCH ()-[r]->() RETURN count(r) AS c")
                    edge_cnt = int(e_res.result_set[0][0]) if e_res and e_res.result_set else 0

                    ep_res = t_graph.query("MATCH (ep:Episode) RETURN count(ep) AS c")
                    ep_cnt = int(ep_res.result_set[0][0]) if ep_res and ep_res.result_set else 0
                except Exception:
                    node_cnt = 0
                    edge_cnt = 0
                    ep_cnt = 0

                tenants.append(
                    TenantSummary(
                        id=t_id,
                        name=t_name,
                        industry=t_industry,
                        description=t_desc,
                        node_count=node_cnt,
                        edge_count=edge_cnt,
                        episode_count=ep_cnt
                    )
                )
        return tenants

    def create_tenant(self, tenant_id: str, name: str, industry: str, description: str) -> TenantSummary:
        clean_id = tenant_id.strip().lower()
        now_iso = datetime.now(timezone.utc).isoformat()
        reg_graph = falkor_manager.select_registry_graph()

        reg_graph.query("""
            MERGE (t:Tenant {id: $id})
            SET t.name = $name, t.industry = $industry, t.description = $description, t.created_at = $created_at
        """, {
            "id": clean_id,
            "name": name,
            "industry": industry,
            "description": description,
            "created_at": now_iso
        })

        # Pre-seed a default preset scenario for ad-hoc inspection
        reg_graph.query("""
            MATCH (t:Tenant {id: $tenant_id})
            MERGE (p:PresetScenario {id: $preset_id})
            SET p.tenant_id = $tenant_id,
                p.label = $label,
                p.category = $category,
                p.query_text = $query_text,
                p.expected_outcome = $expected_outcome
            MERGE (t)-[:HAS_PRESET]->(p)
        """, {
            "tenant_id": clean_id,
            "preset_id": f"preset_{clean_id}_01",
            "label": "Audit Operational State",
            "category": "AUTHORIZED",
            "query_text": f"Check operational dependencies and governance compliance for {name}",
            "expected_outcome": "APPROVED"
        })

        # Initialize the tenant's isolated graph
        t_graph = falkor_manager.select_tenant_graph(clean_id)
        t_graph.query("RETURN 1")

        return TenantSummary(
            id=clean_id,
            name=name,
            industry=industry,
            description=description,
            node_count=0,
            edge_count=0,
            episode_count=0
        )

    def get_tenant_context(self, tenant_id: str) -> Optional[TenantContextResponse]:
        clean_id = tenant_id.strip().lower()
        reg_graph = falkor_manager.select_registry_graph()

        t_res = reg_graph.query("""
            MATCH (t:Tenant {id: $id})
            RETURN t.id AS id, t.name AS name, t.industry AS industry, t.description AS description
        """, {"id": clean_id})

        if not t_res or not t_res.result_set:
            return None

        row = t_res.result_set[0]
        t_id, t_name, t_industry, t_desc = str(row[0]), str(row[1]), str(row[2]), str(row[3])

        # Fetch presets
        p_res = reg_graph.query("""
            MATCH (t:Tenant {id: $id})-[:HAS_PRESET]->(p:PresetScenario)
            RETURN p.id, p.label, p.category, p.query_text, p.expected_outcome
        """, {"id": clean_id})

        presets: List[PresetScenario] = []
        if p_res and p_res.result_set:
            for p_row in p_res.result_set:
                presets.append(PresetScenario(
                    id=str(p_row[0]),
                    label=str(p_row[1]),
                    category=str(p_row[2]),
                    query_text=str(p_row[3]),
                    expected_outcome=str(p_row[4])
                ))

        # Fetch sample documents
        d_res = reg_graph.query("""
            MATCH (t:Tenant {id: $id})-[:HAS_SAMPLE_DOC]->(d:SampleDoc)
            RETURN d.id, d.title, d.doc_type, d.raw_text
        """, {"id": clean_id})

        sample_docs: List[SampleDocument] = []
        if d_res and d_res.result_set:
            for d_row in d_res.result_set:
                sample_docs.append(SampleDocument(
                    id=str(d_row[0]),
                    title=str(d_row[1]),
                    doc_type=str(d_row[2]),
                    raw_text=str(d_row[3])
                ))

        # Live stats
        try:
            t_graph = falkor_manager.select_tenant_graph(clean_id)
            n_res = t_graph.query("MATCH (n) RETURN count(n) AS c")
            node_cnt = int(n_res.result_set[0][0]) if n_res and n_res.result_set else 0

            e_res = t_graph.query("MATCH ()-[r]->() RETURN count(r) AS c")
            edge_cnt = int(e_res.result_set[0][0]) if e_res and e_res.result_set else 0

            ep_res = t_graph.query("MATCH (ep:Episode) RETURN count(ep) AS c")
            ep_cnt = int(ep_res.result_set[0][0]) if ep_res and ep_res.result_set else 0
        except Exception:
            node_cnt, edge_cnt, ep_cnt = 0, 0, 0

        summary = TenantSummary(
            id=t_id,
            name=t_name,
            industry=t_industry,
            description=t_desc,
            node_count=node_cnt,
            edge_count=edge_cnt,
            episode_count=ep_cnt
        )

        return TenantContextResponse(
            tenant=summary,
            presets=presets,
            sample_documents=sample_docs
        )

registry_service = RegistryService()
