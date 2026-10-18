from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class NodeLabel(str, Enum):
    ACTOR = "Actor"
    GROUP = "Group"
    RESOURCE = "Resource"
    POLICY = "Policy"
    EPISODE = "Episode"
    DOCUMENT = "Document"

class RelationType(str, Enum):
    REPORTS_TO = "REPORTS_TO"
    BELONGS_TO = "BELONGS_TO"
    OWNS = "OWNS"
    DEPENDS_ON = "DEPENDS_ON"
    GOVERNED_BY = "GOVERNED_BY"
    COMPLIES_WITH = "COMPLIES_WITH"
    SOURCED_FROM = "SOURCED_FROM"
    IMPACTS = "IMPACTS"
    INITIATED_BY = "INITIATED_BY"
    EVALUATED_POLICY = "EVALUATED_POLICY"
    HANDED_OFF_TO = "HANDED_OFF_TO"

class OntologyLabelMeta(BaseModel):
    label: NodeLabel
    color: str
    border_color: str
    description: str

class OntologyMetadataResponse(BaseModel):
    node_labels: List[OntologyLabelMeta]
    relation_types: List[str]

# Canonical Universal Metadata definitions
ONTOLOGY_METADATA = OntologyMetadataResponse(
    node_labels=[
        OntologyLabelMeta(
            label=NodeLabel.ACTOR,
            color="#2563eb",
            border_color="#1d4ed8",
            description="Human or automated operational entity (Engineers, Directors, Field Volunteers, IAM Bots)"
        ),
        OntologyLabelMeta(
            label=NodeLabel.GROUP,
            color="#4f46e5",
            border_color="#4338ca",
            description="Organizational unit, team, ward, regional dispatch center, or guild"
        ),
        OntologyLabelMeta(
            label=NodeLabel.RESOURCE,
            color="#d97706",
            border_color="#b45309",
            description="Operational asset, database, API service, cold storage vault, or field clinic"
        ),
        OntologyLabelMeta(
            label=NodeLabel.POLICY,
            color="#7c3aed",
            border_color="#6d28d9",
            description="Governance regulation, standard operating procedure, compliance rule, or SLA requirement"
        ),
        OntologyLabelMeta(
            label=NodeLabel.EPISODE,
            color="#0891b2",
            border_color="#0e7490",
            description="Stateful incident, agent reasoning session, historical event, or audit trail node"
        ),
        OntologyLabelMeta(
            label=NodeLabel.DOCUMENT,
            color="#059669",
            border_color="#047857",
            description="Source enterprise document, runbook, architecture specification, or uploaded file"
        ),
    ],
    relation_types=[r.value for r in RelationType]
)

class OntologyNode(BaseModel):
    id: str
    label: NodeLabel
    name: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class OntologyEdge(BaseModel):
    source: str
    target: str
    relation: RelationType
    properties: Dict[str, Any] = Field(default_factory=dict)

class ExtractedGraph(BaseModel):
    nodes: List[OntologyNode]
    edges: List[OntologyEdge]
