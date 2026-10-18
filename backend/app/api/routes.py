from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.models.ontology import ONTOLOGY_METADATA, OntologyMetadataResponse
from app.models.api_schemas import (
    HealthResponse,
    TenantSummary,
    CreateTenantRequest,
    TenantContextResponse,
    GraphDataResponse,
    IngestDocumentRequest,
    IngestDocumentResponse,
    SwarmExecutionRequest,
    SwarmExecutionResponse
)
from app.db.falkor_manager import falkor_manager
from app.services.registry_service import registry_service
from app.services.ingestion_service import ingestion_service
from app.services.seed_service import seed_service
from app.agents.workflow import run_swarm

api_router = APIRouter(prefix="/api/v1")

@api_router.get("/health", response_model=HealthResponse)
def health_check():
    connected = falkor_manager.check_connection()
    return HealthResponse(status="healthy", falkordb_connected=connected)

@api_router.get("/ontology", response_model=OntologyMetadataResponse)
def get_ontology():
    return ONTOLOGY_METADATA

@api_router.get("/tenants", response_model=List[TenantSummary])
def list_tenants():
    return registry_service.get_all_tenants()

@api_router.post("/tenants", response_model=TenantSummary, status_code=status.HTTP_201_CREATED)
def create_tenant(payload: CreateTenantRequest):
    return registry_service.create_tenant(
        tenant_id=payload.id,
        name=payload.name,
        industry=payload.industry,
        description=payload.description
    )

@api_router.get("/tenants/{tenant_id}/context", response_model=TenantContextResponse)
def get_tenant_context(tenant_id: str):
    ctx = registry_service.get_tenant_context(tenant_id)
    if not ctx:
        raise HTTPException(status_code=404, detail=f"Tenant '{tenant_id}' not found in registry.")
    return ctx

@api_router.post("/tenants/{tenant_id}/reset")
def reset_tenant(tenant_id: str):
    clean_id = tenant_id.strip().lower()
    if clean_id in ["fintech", "ngo"]:
        seed_service.seed_all(force=True)
    else:
        g = falkor_manager.select_tenant_graph(clean_id)
        g.query("MATCH (n) DETACH DELETE n")
    return {"status": "success", "tenant_id": clean_id, "message": "Graph reset and re-initialized."}

@api_router.get("/tenants/{tenant_id}/graph", response_model=GraphDataResponse)
def get_tenant_graph(tenant_id: str):
    return falkor_manager.serialize_tenant_graph(tenant_id)

@api_router.post("/tenants/{tenant_id}/ingest", response_model=IngestDocumentResponse)
def ingest_document(tenant_id: str, payload: IngestDocumentRequest):
    print(f"[Routes] /ingest called for tenant: {tenant_id}, doc: {payload.title}")
    res = ingestion_service.ingest_document(tenant_id, payload)
    print(f"[Routes] /ingest finished. Nodes created: {res.nodes_created}")
    return res

@api_router.post("/tenants/{tenant_id}/agent/execute", response_model=SwarmExecutionResponse)
def execute_agent_swarm(tenant_id: str, payload: SwarmExecutionRequest):
    return run_swarm(tenant_id, payload.query)

@api_router.post("/mock/webhook")
def mock_webhook_receiver(payload: Dict[str, Any]):
    return {"status": "dispatched", "received_payload": payload}
