# OmniGraph: Zero-Shot Multi-Tenant Enterprise AI Governance Fabric

OmniGraph decouples the **Agent Reasoning Engine** (a static, domain-agnostic 4-node LangGraph swarm) from the **Enterprise Topology Map** (an isolated FalkorDB multigraph per tenant).

When an enterprise uploads its operational documents (`.md`, `.csv`, `.json`), OmniGraph compiles them into the Universal Enterprise Ontology (`Actor`, `Group`, `Resource`, `Policy`, `Episode`, `Document`) inside an isolated FalkorDB tenant namespace. The agent swarm adapts to the organization dynamically without any code changes.

---

## Architecture Alignment

| Hackathon Track | Mechanism |
| :--- | :--- |
| **Track 01: Agents That Act on Connected Data** | Swarm agents invoke deterministic FalkorDB tools: `compute_blast_radius` (bounded variable-length traversal `[:DEPENDS_ON*1..4]`) and `verify_governance` (multi-hop hierarchy `[:OWNS\|REPORTS_TO\|BELONGS_TO*1..3]` & compliance checking `[:COMPLIES_WITH]`). Actions execute external webhooks only when fail-closed governance is verified. |
| **Track 02: Agent Memory & Coordination** | Multigraph isolation (`tenant_{id}`) + `omnigraph_registry`. LangGraph nodes coordinate state by writing `(:Episode)` nodes and `[:IMPACTS]`, `[:EVALUATED_POLICY]`, and `[:HANDED_OFF_TO]` edges directly into FalkorDB, and recalling past episodes across sessions. |
| **Track 03: Company Brain** | Schema-enforced LLM entity extraction converts raw enterprise documents into connected ontology nodes, maintaining provenance via `[:SOURCED_FROM]` edges to `(:Document)` nodes. |

---

## Quickstart

### 1. Prerequisites
- Docker Desktop running locally
- Python 3.12+ / 3.13
- Node.js 18+ and npm

### 2. Infrastructure & FalkorDB
```bash
# Start FalkorDB locally
docker compose up -d falkordb
```
- FalkorDB RESP Protocol Port: `6379`
- FalkorDB Browser UI: `http://localhost:3001` (mapped from 3000)

### 3. Backend Setup & Run
```bash
cd backend
pip install -r requirements.txt
# Set PYTHONPATH and run server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- API Base URL: `http://localhost:8000/api/v1`
- Swagger Interactive Docs: `http://localhost:8000/docs`

### 4. Frontend Setup & Run
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
npm run start
```
- Enterprise Console UI: `http://localhost:3000`

---

## Pre-Seeded Enterprise Tenants

1. **NexusPay Cloud Infrastructure (`fintech`)**
   - **Industry:** FinTech & Distributed High-Frequency Payment Systems
   - **Preset 1 (Authorized):** `Alice Vance requests emergency rollback on Primary Ledger PostgreSQL` -> Outcome: `APPROVED`
   - **Preset 2 (Fail-Closed Test):** `Dave Miller requests emergency rollback on Primary Ledger PostgreSQL` -> Outcome: `DENIED`

2. **PulseGlobal Medical Logistics (`ngo`)**
   - **Industry:** Humanitarian Aid & Ultra-Cold Biologics Supply Chain
   - **Preset 1 (Authorized):** `Dr. Arindam Sen requests emergency dispatch from Cryo-Vault Alpha Biologics` -> Outcome: `APPROVED`
   - **Preset 2 (Fail-Closed Test):** `Maya Lin requests emergency dispatch from Cryo-Vault Alpha Biologics` -> Outcome: `DENIED`
