from datetime import datetime, timezone
from app.db.falkor_manager import falkor_manager

class SeedService:
    """
    Populates omnigraph_registry and isolated tenant graphs (tenant_fintech, tenant_ngo)
    on startup if not already seeded.
    """
    def seed_all(self, force: bool = False):
        reg = falkor_manager.select_registry_graph()
        
        # Check if already seeded
        if not force:
            chk = reg.query("MATCH (t:Tenant) RETURN count(t) AS c")
            if chk and chk.result_set and int(chk.result_set[0][0]) >= 2:
                print("[SeedService] Registry already seeded, skipping.")
                return

        print("[SeedService] Seeding omnigraph_registry and initial enterprise tenant graphs...")

        # Clear registry if forcing
        if force:
            reg.query("MATCH (n) DETACH DELETE n")

        now_iso = datetime.now(timezone.utc).isoformat()

        # =========================================================================
        # 1. SEED TENANT 1: FINTECH (NexusPay Cloud Infrastructure)
        # =========================================================================
        reg.query("""
            MERGE (t:Tenant {id: 'fintech'})
            SET t.name = 'NexusPay Cloud Infrastructure',
                t.industry = 'FinTech & High-Frequency Payments',
                t.description = 'Mission-critical distributed payment gateways, ledgers, and zero-trust authentication.',
                t.created_at = $created_at
        """, {"created_at": now_iso})

        # Presets for FinTech
        reg.query("""
            MATCH (t:Tenant {id: 'fintech'})
            MERGE (p1:PresetScenario {id: 'preset_fintech_01'})
            SET p1.tenant_id = 'fintech',
                p1.label = 'Emergency Rollback (Alice Vance)',
                p1.category = 'AUTHORIZED',
                p1.query_text = 'Alice Vance requests emergency rollback on Primary Ledger PostgreSQL',
                p1.expected_outcome = 'APPROVED'
            MERGE (p2:PresetScenario {id: 'preset_fintech_02'})
            SET p2.tenant_id = 'fintech',
                p2.label = 'Unauthorized Rollback (Dave Miller)',
                p2.category = 'UNAUTHORIZED',
                p2.query_text = 'Dave Miller requests emergency rollback on Primary Ledger PostgreSQL',
                p2.expected_outcome = 'DENIED'
            MERGE (t)-[:HAS_PRESET]->(p1)
            MERGE (t)-[:HAS_PRESET]->(p2)
        """)

        # Sample Doc for FinTech
        reg.query("""
            MATCH (t:Tenant {id: 'fintech'})
            MERGE (d:SampleDoc {id: 'sample_fintech_01'})
            SET d.tenant_id = 'fintech',
                d.title = 'Q4_Redis_Cache_Cluster_Spec.md',
                d.doc_type = 'markdown',
                d.raw_text = 'The Redis Session Cluster is a HIGH criticality Resource owned by Alice Vance. Merchant Checkout Gateway depends on Redis Session Cluster. Redis Session Cluster is governed by SOC2 Production Rollback Policy.'
            MERGE (t)-[:HAS_SAMPLE_DOC]->(d)
        """)

        # Populate tenant_fintech graph
        g_fintech = falkor_manager.select_tenant_graph("fintech")
        g_fintech.query("MATCH (n) DETACH DELETE n")

        g_fintech.query("""
            CREATE (a1:Actor {id: 'act_alice_vance', name: 'Alice Vance', role: 'Lead SRE', department: 'Infrastructure', clearance_level: 'L3'})
            CREATE (a2:Actor {id: 'act_bob_sterling', name: 'Bob Sterling', role: 'VP Engineering', department: 'Leadership', clearance_level: 'L4'})
            CREATE (a3:Actor {id: 'act_dave_miller', name: 'Dave Miller', role: 'Junior Web Dev', department: 'Frontend', clearance_level: 'L1'})
            CREATE (grp:Group {id: 'grp_platform_sre', name: 'Platform SRE Guild', unit_type: 'Engineering Guild', region: 'Global'})

            CREATE (r1:Resource {id: 'res_primary_ledger', name: 'Primary Ledger PostgreSQL', resource_type: 'Relational Database', criticality: 'CRITICAL', status: 'ONLINE'})
            CREATE (r2:Resource {id: 'res_auth_api', name: 'ZeroTrust Auth API', resource_type: 'Microservice', criticality: 'HIGH', status: 'ONLINE'})
            CREATE (r3:Resource {id: 'res_merchant_gateway', name: 'Merchant Checkout Gateway', resource_type: 'Payment Ingress API', criticality: 'CRITICAL', status: 'ONLINE'})

            CREATE (pol:Policy {id: 'pol_soc2_rollback', name: 'SOC2 Production Rollback Policy', rule_type: 'Governance Standard', enforcement: 'FAIL_CLOSED', required_role: 'Lead SRE', description: 'Requires direct SRE Guild ownership and verified SOC2 active training compliance.'})
            CREATE (doc:Document {id: 'doc_soc2_rollback_std', title: 'SOC2_Rollback_Standard_v4.md', doc_type: 'markdown', uploaded_at: $created_at})

            CREATE (ep:Episode {id: 'ep_seed_fintech_01', query: 'Elevated replication lag on Primary Ledger PostgreSQL', decision: 'APPROVED', rationale: 'Alice Vance authorized read-replica promotion under SOC2 standard', timestamp: $created_at})

            CREATE (a1)-[:BELONGS_TO]->(grp)
            CREATE (a1)-[:REPORTS_TO]->(a2)
            CREATE (a3)-[:REPORTS_TO]->(a1)
            CREATE (grp)-[:OWNS]->(r1)
            CREATE (a1)-[:OWNS]->(r2)
            CREATE (r3)-[:DEPENDS_ON]->(r2)
            CREATE (r2)-[:DEPENDS_ON]->(r1)
            CREATE (r1)-[:GOVERNED_BY]->(pol)
            CREATE (pol)-[:SOURCED_FROM]->(doc)
            CREATE (a1)-[:COMPLIES_WITH {verified: true}]->(pol)
            CREATE (ep)-[:IMPACTS]->(r1)
            CREATE (ep)-[:INITIATED_BY]->(a1)
        """, {"created_at": now_iso})

        # =========================================================================
        # 2. SEED TENANT 2: NGO (PulseGlobal Medical Logistics)
        # =========================================================================
        reg.query("""
            MERGE (t:Tenant {id: 'ngo'})
            SET t.name = 'PulseGlobal Medical Logistics',
                t.industry = 'Humanitarian Aid & Medical Cold-Chain',
                t.description = 'Autonomous drone distribution, ultra-cold biologics vaults, and disaster response field triage.',
                t.created_at = $created_at
        """, {"created_at": now_iso})

        # Presets for NGO
        reg.query("""
            MATCH (t:Tenant {id: 'ngo'})
            MERGE (p1:PresetScenario {id: 'preset_ngo_01'})
            SET p1.tenant_id = 'ngo',
                p1.label = 'Emergency Biologics Dispatch (Dr. Sen)',
                p1.category = 'AUTHORIZED',
                p1.query_text = 'Dr. Arindam Sen requests emergency dispatch from Cryo-Vault Alpha Biologics',
                p1.expected_outcome = 'APPROVED'
            MERGE (p2:PresetScenario {id: 'preset_ngo_02'})
            SET p2.tenant_id = 'ngo',
                p2.label = 'Unauthorized Dispatch (Maya Lin)',
                p2.category = 'UNAUTHORIZED',
                p2.query_text = 'Maya Lin requests emergency dispatch from Cryo-Vault Alpha Biologics',
                p2.expected_outcome = 'DENIED'
            MERGE (t)-[:HAS_PRESET]->(p1)
            MERGE (t)-[:HAS_PRESET]->(p2)
        """)

        # Sample Doc for NGO
        reg.query("""
            MATCH (t:Tenant {id: 'ngo'})
            MERGE (d:SampleDoc {id: 'sample_ngo_01'})
            SET d.tenant_id = 'ngo',
                d.title = 'Mobile_Blood_Bank_Unit_Roster.md',
                d.doc_type = 'markdown',
                d.raw_text = 'Helipad Cold Storage B is a CRITICAL Resource owned by Eastern Sector Cold-Chain Hub. Sundarbans Trauma Field Clinic depends on Helipad Cold Storage B. Helipad Cold Storage B is governed by WHO Biologics Cold-Chain Dispatch Standard.'
            MERGE (t)-[:HAS_SAMPLE_DOC]->(d)
        """)

        # Populate tenant_ngo graph
        g_ngo = falkor_manager.select_tenant_graph("ngo")
        g_ngo.query("MATCH (n) DETACH DELETE n")

        g_ngo.query("""
            CREATE (a1:Actor {id: 'act_dr_arindam_sen', name: 'Dr. Arindam Sen', role: 'Regional Medical Director', department: 'Emergency Medicine', clearance_level: 'L4'})
            CREATE (a2:Actor {id: 'act_maya_lin', name: 'Maya Lin', role: 'Field Transport Volunteer', department: 'Logistics', clearance_level: 'L1'})
            CREATE (grp:Group {id: 'grp_eastern_cold_chain', name: 'Eastern Sector Cold-Chain Hub', unit_type: 'Regional Triage Hub', region: 'South Asia'})

            CREATE (r1:Resource {id: 'res_cryo_vault_alpha', name: 'Cryo-Vault Alpha Biologics', resource_type: 'Ultra-Cold Storage', criticality: 'CRITICAL', status: 'ONLINE'})
            CREATE (r2:Resource {id: 'res_drone_relay', name: 'Autonomous Cargo Drone Relay', resource_type: 'Air Transport Fleet', criticality: 'HIGH', status: 'ONLINE'})
            CREATE (r3:Resource {id: 'res_sundarbans_clinic', name: 'Sundarbans Trauma Field Clinic', resource_type: 'Field Hospital', criticality: 'HIGH', status: 'ONLINE'})

            CREATE (pol:Policy {id: 'pol_who_cold_chain', name: 'WHO Biologics Cold-Chain Dispatch Standard', rule_type: 'Standard Operating Procedure', enforcement: 'FAIL_CLOSED', required_role: 'Regional Medical Director', description: 'Requires direct Cold-Chain Hub ownership and authorized WHO Level 4 biological certification.'})
            CREATE (doc:Document {id: 'doc_who_sop_2026', title: 'WHO_Cold_Chain_SOP_2026.md', doc_type: 'markdown', uploaded_at: $created_at})

            CREATE (ep:Episode {id: 'ep_seed_ngo_01', query: 'Monsoon route disruption to Sundarbans Trauma Field Clinic', decision: 'APPROVED', rationale: 'Dr. Arindam Sen authorized drone relay dispatch from Cryo-Vault Alpha', timestamp: $created_at})

            CREATE (a1)-[:BELONGS_TO]->(grp)
            CREATE (a2)-[:REPORTS_TO]->(a1)
            CREATE (grp)-[:OWNS]->(r1)
            CREATE (a1)-[:OWNS]->(r2)
            CREATE (r3)-[:DEPENDS_ON]->(r2)
            CREATE (r2)-[:DEPENDS_ON]->(r1)
            CREATE (r1)-[:GOVERNED_BY]->(pol)
            CREATE (pol)-[:SOURCED_FROM]->(doc)
            CREATE (a1)-[:COMPLIES_WITH {verified: true}]->(pol)
            CREATE (ep)-[:IMPACTS]->(r1)
            CREATE (ep)-[:INITIATED_BY]->(a1)
        """, {"created_at": now_iso})

        print("[SeedService] Seeding completed successfully.")

seed_service = SeedService()
