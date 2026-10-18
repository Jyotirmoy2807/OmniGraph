# OmniGraph Live Demo Cheat Sheet

This guide provides three plug-and-play tenant configurations you can create and ingest live during your demo.

---

## Demo Tenant 1: OrbitGuard Aerospace
- **Tenant ID:** `orbitguard`
- **Tenant Name:** `OrbitGuard Aerospace`
- **Industry:** `Satellite Telemetry & Orbital Defense`
- **Description:** `Autonomous satellite constellation routing and orbital collision mitigation.`
- **File to Ingest:** `samples/01_orbitguard_aerospace.md`
Screen:
Start on the OmniGraph dashboard (http://localhost:3000). Highlight the clean UI, the active FalkorDB connection badge, and the tenant dropdown.

Voiceover:

"When enterprises deploy autonomous AI agents to manage production systems, healthcare databases, or critical infrastructure, two major roadblocks emerge:

First: Onboarding a new company's systems, teams, and compliance rules usually takes weeks of manual schema modeling.
Second: Once deployed, AI agents lack deterministic guardrails—leading to compliance violations and unverified actions.

This is OmniGraph—a Zero-Shot Multi-Tenant AI Governance Fabric powered by FalkorDB.

Today, I'm going to onboard an entirely new enterprise tenant from scratch by uploading a raw operational specification, compile it into FalkorDB in seconds, and prove how our agent swarm enforces fail-closed governance in real time."

[0:35 – 1:50] Act 2: Hero Walkthrough — Ingesting New Company Documents (Live)

Screen:

In the header bar, click + New Tenant.
Enter:
ID: orbitguard
Name: OrbitGuard Aerospace
Industry: Satellite Telemetry & Orbital Defense
Description: Autonomous satellite routing and orbital collision avoidance.
Click Create Tenant. Point out that OrbitGuard starts with 0 Nodes, 0 Edges.
Click on the 4th tab: Company Brain & Docs.
Drag and drop samples/01_orbitguard_aerospace.md into the dropzone (or click to browse).
Show the auto-populated title, format selector (Markdown), character counter, and content preview.
Click Compile into FalkorDB.

Voiceover:

"Let's onboard a brand-new tenant: OrbitGuard Aerospace.

Under the hood, FalkorDB instantly provisions a dedicated, physically isolated graph namespace—tenant_orbitguard—guaranteeing zero cross-tenant leakage.

Notice the node and edge count is zero. Now, let's open the Company Brain & Docs tab.

Rather than writing database migrations or manual Cypher scripts, we simply drag and drop our operational document: 01_orbitguard_aerospace.md.

This raw markdown describes flight directors, telemetry relays, ion propulsion subsystems, and kinetic safety policies.

We click Compile into FalkorDB.

Our LLM schema compiler analyzes the document, maps entities to our Universal Enterprise Ontology (Actor, Group, Resource, Policy), and executes parameterized OpenCypher MERGE queries.

And in just seconds: 10 nodes and 12 relationships have been compiled into FalkorDB, complete with [:SOURCED_FROM] document provenance links."

[1:50 – 2:30] Act 3: Inspecting the Newly Ingested Knowledge Graph

Screen:
Click the 2nd tab: Knowledge Graph.
Pan and zoom the canvas. Click on a node (e.g., Elena Rostova or Ion Propulsion Subsystem) to open the Node Inspector on the right.

Voiceover:

"Let's switch to the Knowledge Graph tab to see what was built.

FalkorDB's GraphBLAS linear algebra engine renders the complete enterprise topology:

We see Marcus Vance reporting to Commander Elena Rostova.
Elena belongs to the Constellation Flight Guild, which owns the Ion Propulsion Subsystem.
The Ion Propulsion Subsystem depends on the Telemetry Downlink Relay, which in turn depends on the Primary Orbital Guidance Computer.
And crucially, the thruster subsystem is governed by the Kinetic De-Orbit Safety Policy.

Every entity is structured, color-coded, and linked to the source document—all from a single markdown file."

[2:30 – 3:30] Act 4: Real-Time Governance on the Newly Ingested Graph

Screen:
Switch to Tab 1: Command & Governance.
In the Dispatch Custom Request text box, paste:
Marcus Vance requests thruster ignition on Ion Propulsion Subsystem
Click Run Swarm. Show the red ACTION DENIED — FAIL-CLOSED POLICY BLOCK banner and the discovered blast radius.

Voiceover:

"Now let's test if our AI agent swarm actually honors the rules we just ingested.

Marcus Vance—a Junior Operator—attempts to ignite the Ion Propulsion Subsystem.

We click Run Swarm.

In under 10 milliseconds, the execution halts: ACTION DENIED — FAIL-CLOSED POLICY BLOCK.

Let's look at the telemetry:

The TriageRouter anchored Marcus and the Ion Propulsion Subsystem.
The GraphInvestigator executed variable-length path matching (DEPENDS_ON*1..3) and detected a multi-hop blast radius propagating through the Telemetry Relay to the Primary Guidance Computer.
The PolicyGatekeeper checked the Kinetic De-Orbit Policy. Because Marcus lacks the required Orbital Operations Director role, the action was fail-closed blocked.

No destructive action occurred, and a stateful (:Episode) node was written to FalkorDB for audit logging."

Screen:
Now paste an authorized query:
Commander Elena Rostova executes emergency station-keeping burn on Ion Propulsion Subsystem
Click Run Swarm. Show the green ACTION APPROVED & EXECUTED banner.

Voiceover:

"Now let's run the authorized request from Commander Elena Rostova.

We hit Run Swarm—and it's APPROVED.

Elena holds verified compliance with the Kinetic Safety standard and has direct guild ownership over the asset.

The ActionExecutor safely dispatches the external webhook."

[3:30 – 3:55] Act 5: Conclusion & Wrap-Up

Screen:
Click the Memory & Cypher Log tab. Show the list of episodes and the exact parameterized OpenCypher traces with execution times (<10ms).

Voiceover:

"To recap:
With OmniGraph and FalkorDB, onboarding an enterprise is as simple as dropping in a document.

You get:

Zero-shot multi-tenant document compilation.
Sub-10ms GraphBLAS blast radius and authorization traversal.
Deterministic fail-closed AI guardrails.
And graph-native episodic memory.

OmniGraph: Zero-Shot Enterprise AI Governance, powered by FalkorDB. Thank you."
### Test Queries:
1. **Authorized (PASSES):**
   ```text
   Commander Elena Rostova executes emergency station-keeping burn on Ion Propulsion Subsystem
   ```
2. **Fail-Closed Violation (BLOCKED):**
   ```text
   Marcus Vance requests thruster ignition on Ion Propulsion Subsystem
   ```

---

## Demo Tenant 2: MediVault Genomic Health
- **Tenant ID:** `medivault`
- **Tenant Name:** `MediVault Genomic Health`
- **Industry:** `Precision Oncology & Genomic Records`
- **Description:** `HIPAA-regulated clinical oncology pipelines and patient genomic sequencing.`
- **File to Ingest:** `samples/02_medivault_genomics.md`

### Test Queries:
1. **Authorized (PASSES):**
   ```text
   Dr. Maya Lin requests export of tumor sequencing from Genomic Variant Analysis Cluster
   ```
2. **Fail-Closed Violation (BLOCKED):**
   ```text
   Kevin Brooks attempts raw batch dump on Genomic Variant Analysis Cluster
   ```

---

## Demo Tenant 3: CyberGrid Energy Systems
- **Tenant ID:** `cybergrid`
- **Tenant Name:** `CyberGrid Energy Systems`
- **Industry:** `Critical Infrastructure & Grid SCADA`
- **Description:** `High-voltage grid telemetry, substation automated switching, and NERC CIP defense.`
- **File to Ingest:** `samples/03_cybergrid_energy.md`

### Test Queries:
1. **Authorized (PASSES):**
   ```text
   Sophia Martinez commands isolation of Substation Relay Controller Alpha
   ```
2. **Fail-Closed Violation (BLOCKED):**
   ```text
   Leo Zhang attempts remote firmware flash on Substation Relay Controller Alpha
   ```
