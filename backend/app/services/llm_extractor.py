import json
import re
from typing import Optional
from openai import OpenAI
from app.config import settings
from app.models.ontology import ExtractedGraph, OntologyNode, OntologyEdge, NodeLabel, RelationType

EXTRACTION_SYSTEM_PROMPT = """You are an enterprise knowledge graph architect.
Your job is to read raw enterprise documents and extract entities and relationships strictly matching the Universal Enterprise Ontology.

Node Labels:
- Actor (properties: name, role, department, clearance_level)
- Group (properties: name, unit_type, region)
- Resource (properties: name, resource_type, criticality, status)
- Policy (properties: name, rule_type, enforcement, required_role, description)
- Document (properties: title, doc_type)

Allowed Relation Types:
- REPORTS_TO (Actor -> Actor)
- BELONGS_TO (Actor -> Group)
- OWNS (Actor/Group -> Resource)
- DEPENDS_ON (Resource -> Resource)
- GOVERNED_BY (Resource -> Policy)
- COMPLIES_WITH (Actor -> Policy)
- SOURCED_FROM (Actor/Group/Resource/Policy -> Document)

Generate an ID for each entity formatted as prefix_slug (e.g. res_redis_cache, act_alice_vance, pol_soc2_rollback).
Respond with a strict JSON object:
{
  "nodes": [{"id": "...", "label": "...", "name": "...", "properties": {...}}],
  "edges": [{"source": "...", "target": "...", "relation": "...", "properties": {...}}]
}
Do not include markdown or explanations.
"""

class LLMExtractor:
    def __init__(self):
        self.client: Optional[OpenAI] = None
        self._init_client()

    def _init_client(self):
        if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("your_"):
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        elif settings.LLM_PROVIDER == "groq" and settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("your_"):
            self.client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=settings.GROQ_API_KEY)
        else:
            self.client = None

    def extract(self, title: str, doc_type: str, raw_text: str) -> ExtractedGraph:
        if self.client:
            try:
                # Do not enforce response_format={"type": "json_object"} as some Groq models reject or error out on it
                response = self.client.chat.completions.create(
                    model=settings.LLM_MODEL,
                    messages=[
                        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                        {"role": "user", "content": f"Extract this document into a JSON object strictly following the ontology schema.\nDocument Title: {title}\nDoc Type: {doc_type}\n\nContent:\n{raw_text}"}
                    ],
                    max_tokens=4000,
                    temperature=0.1
                )
                raw_content = response.choices[0].message.content or "{}"
                # Extract JSON block if wrapped in markdown code fence
                json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_content)
                raw_json = json_match.group(1) if json_match else raw_content.strip()

                data = json.loads(raw_json)
                
                # Sanitize extracted nodes to guarantee valid Pydantic fields
                sanitized_nodes = []
                for item in data.get("nodes", []):
                    if isinstance(item, str):
                        prefix = item.split("_")[0] if "_" in item else "res"
                        lbl_map = {"act": NodeLabel.ACTOR, "grp": NodeLabel.GROUP, "res": NodeLabel.RESOURCE, "pol": NodeLabel.POLICY, "doc": NodeLabel.DOCUMENT}
                        lbl = lbl_map.get(prefix, NodeLabel.RESOURCE)
                        name_str = item.replace(f"{prefix}_", "").replace("_", " ").title()
                        sanitized_nodes.append({
                            "id": item,
                            "label": lbl,
                            "name": name_str,
                            "properties": {}
                        })
                    elif isinstance(item, dict):
                        if not item.get("name"):
                            props = item.get("properties", {})
                            item["name"] = props.get("title") or props.get("name") or item.get("id", "Unknown")
                        if not item.get("properties"):
                            item["properties"] = {}
                        sanitized_nodes.append(item)
                
                data["nodes"] = sanitized_nodes
                
                # Sanitize edges
                sanitized_edges = []
                for edge in data.get("edges", []):
                    if isinstance(edge, dict) and edge.get("source") and edge.get("target") and edge.get("relation"):
                        if not edge.get("properties"):
                            edge["properties"] = {}
                        sanitized_edges.append(edge)
                data["edges"] = sanitized_edges

                if len(data["nodes"]) > 0:
                    return ExtractedGraph(**data)
            except Exception as e:
                print(f"[LLM Extractor] External LLM failed ({e}), falling back to deterministic parser")

        return self._deterministic_fallback(title, doc_type, raw_text)

    def _deterministic_fallback(self, title: str, doc_type: str, raw_text: str) -> ExtractedGraph:
        """
        High-precision deterministic rule-based extractor for enterprise documents
        guaranteeing clean demo behavior even if external LLM keys are absent.
        """
        nodes = []
        edges = []

        def slugify(text: str) -> str:
            return re.sub(r"[^a-z0-9_]+", "_", text.lower()).strip("_")

        # Create Document node
        doc_id = f"doc_{slugify(title)}"
        nodes.append(OntologyNode(
            id=doc_id,
            label=NodeLabel.DOCUMENT,
            name=title,
            properties={"title": title, "doc_type": doc_type}
        ))

        # Check for Resource keywords
        res_matches = re.findall(r"([A-Z][A-Za-z0-9\s]+?)\s+is a\s+(CRITICAL|HIGH|MEDIUM|LOW)\s+(?:criticality\s+)?Resource", raw_text)
        for res_name, crit in res_matches:
            res_id = f"res_{slugify(res_name.strip())}"
            nodes.append(OntologyNode(
                id=res_id,
                label=NodeLabel.RESOURCE,
                name=res_name.strip(),
                properties={"resource_type": "Infrastructure", "criticality": crit.strip(), "status": "ONLINE"}
            ))
            edges.append(OntologyEdge(
                source=res_id,
                target=doc_id,
                relation=RelationType.SOURCED_FROM
            ))

        # Check for Ownership (owned by X)
        own_matches = re.findall(r"owned by\s+([A-Z][A-Za-z\s]+?)(?:\.|\,|$)", raw_text)
        for owner_name in own_matches:
            owner_name = owner_name.strip()
            # Decide if Group or Actor
            is_group = any(w in owner_name.lower() for w in ["guild", "hub", "team", "ward", "center", "division"])
            lbl = NodeLabel.GROUP if is_group else NodeLabel.ACTOR
            prefix = "grp" if is_group else "act"
            owner_id = f"{prefix}_{slugify(owner_name)}"

            nodes.append(OntologyNode(
                id=owner_id,
                label=lbl,
                name=owner_name,
                properties={"role": "Lead" if not is_group else "Operational Group"}
            ))
            edges.append(OntologyEdge(
                source=owner_id,
                target=doc_id,
                relation=RelationType.SOURCED_FROM
            ))

            # Connect owner to any resource in the doc
            for n in nodes:
                if n.label == NodeLabel.RESOURCE:
                    edges.append(OntologyEdge(
                        source=owner_id,
                        target=n.id,
                        relation=RelationType.OWNS
                    ))

        # Check for Dependency (X depends on Y)
        dep_matches = re.findall(r"([A-Z][A-Za-z0-9\s]+?)\s+depends on\s+([A-Z][A-Za-z0-9\s]+?)(?:\.|\,|$)", raw_text)
        for dependent_res, target_res in dep_matches:
            d_id = f"res_{slugify(dependent_res.strip())}"
            t_id = f"res_{slugify(target_res.strip())}"
            # Ensure target exists
            if not any(n.id == d_id for n in nodes):
                nodes.append(OntologyNode(
                    id=d_id,
                    label=NodeLabel.RESOURCE,
                    name=dependent_res.strip(),
                    properties={"criticality": "HIGH", "status": "ONLINE"}
                ))
            if not any(n.id == t_id for n in nodes):
                nodes.append(OntologyNode(
                    id=t_id,
                    label=NodeLabel.RESOURCE,
                    name=target_res.strip(),
                    properties={"criticality": "HIGH", "status": "ONLINE"}
                ))
            edges.append(OntologyEdge(
                source=d_id,
                target=t_id,
                relation=RelationType.DEPENDS_ON
            ))

        # Check for Governance (X is governed by Y)
        gov_matches = re.findall(r"is governed by\s+([A-Z0-9][A-Za-z0-9\s]+?)(?:\.|\,|$)", raw_text)
        for pol_name in gov_matches:
            pol_id = f"pol_{slugify(pol_name.strip())}"
            nodes.append(OntologyNode(
                id=pol_id,
                label=NodeLabel.POLICY,
                name=pol_name.strip(),
                properties={"rule_type": "SOP", "enforcement": "FAIL_CLOSED"}
            ))
            edges.append(OntologyEdge(
                source=pol_id,
                target=doc_id,
                relation=RelationType.SOURCED_FROM
            ))
            for n in nodes:
                if n.label == NodeLabel.RESOURCE:
                    edges.append(OntologyEdge(
                        source=n.id,
                        target=pol_id,
                        relation=RelationType.GOVERNED_BY
                    ))

        # Deduplicate nodes by id
        unique_nodes = {}
        for n in nodes:
            unique_nodes[n.id] = n

        return ExtractedGraph(nodes=list(unique_nodes.values()), edges=edges)

llm_extractor = LLMExtractor()
