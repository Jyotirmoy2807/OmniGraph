from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import api_router
from app.services.seed_service import seed_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed registry and initial enterprise graphs
    print("[Lifespan] OmniGraph initializing...")
    try:
        seed_service.seed_all()
    except Exception as e:
        print(f"[Lifespan] Error during database seeding: {e}")
    yield
    print("[Lifespan] OmniGraph shutting down...")

app = FastAPI(
    title="OmniGraph API",
    description="Zero-Shot Multi-Tenant Enterprise AI Agent & Governance Platform Powered by FalkorDB",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "name": "OmniGraph API",
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": "/api/v1"
    }
