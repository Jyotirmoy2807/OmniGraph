"""
Parameterized OpenCypher query templates for OmniGraph on FalkorDB.
Rules:
1. Always bind relationship variables: (a)-[r:TYPE]->(b)
2. Bounded variable-length paths: [*1..4]
3. Standard parameterized syntax ($param)
"""

# Blast radius calculation tool
BLAST_RADIUS_QUERY = """
MATCH (target:Resource {id: $resource_id})
OPTIONAL MATCH (dependent:Resource)-[dep_rel:DEPENDS_ON*1..4]->(target)
OPTIONAL MATCH (owner)-[own_rel:OWNS]->(dependent)
RETURN target, dependent, dep_rel, owner, own_rel
"""

# Multi-hop fail-closed governance query
GOVERNANCE_CHECK_QUERY = """
MATCH (actor:Actor {id: $actor_id}), (res:Resource {id: $resource_id})
OPTIONAL MATCH (actor)-[auth_rel:OWNS|BELONGS_TO|REPORTS_TO*1..3]->(auth_target)
WHERE auth_target = res OR (auth_target)-[:OWNS]->(res)
OPTIONAL MATCH (res)-[gov_rel:GOVERNED_BY]->(pol:Policy)
OPTIONAL MATCH (actor)-[comp_rel:COMPLIES_WITH]->(pol)
OPTIONAL MATCH (pol)-[src_rel:SOURCED_FROM]->(doc:Document)
RETURN actor, res, auth_rel, auth_target, gov_rel, pol, comp_rel, src_rel, doc
"""

# Cross-session episodic memory recall query
CROSS_SESSION_EPISODE_QUERY = """
MATCH (ep:Episode)-[imp:IMPACTS]->(res:Resource {id: $resource_id})
WHERE ep.id <> $current_episode_id
RETURN ep, imp, res
ORDER BY ep.timestamp DESC
LIMIT 5
"""

# Dynamic tenant registry queries
REGISTRY_GET_ALL_TENANTS = """
MATCH (t:Tenant)
RETURN t.id AS id, t.name AS name, t.industry AS industry, t.description AS description, t.created_at AS created_at
ORDER BY t.created_at ASC
"""

REGISTRY_GET_TENANT_CONTEXT = """
MATCH (t:Tenant {id: $tenant_id})
OPTIONAL MATCH (t)-[:HAS_PRESET]->(p:PresetScenario)
OPTIONAL MATCH (t)-[:HAS_SAMPLE_DOC]->(d:SampleDoc)
RETURN t, collect(DISTINCT p) AS presets, collect(DISTINCT d) AS sample_docs
"""

# Search and Anchor queries
ANCHOR_ACTOR_QUERY = """
MATCH (a:Actor)
RETURN a.id AS id, a.name AS name, a.role AS role, a.department AS department, a.clearance_level AS clearance_level
"""

ANCHOR_RESOURCE_QUERY = """
MATCH (r:Resource)
RETURN r.id AS id, r.name AS name, r.resource_type AS resource_type, r.criticality AS criticality, r.status AS status
"""

# Full graph fetch query
FETCH_FULL_GRAPH_QUERY = """
MATCH (n)
OPTIONAL MATCH (n)-[r]->(m)
RETURN n, r, m
"""
