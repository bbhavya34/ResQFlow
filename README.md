<div align="center">

<img src="https://img.shields.io/badge/RESQFLOW-0F172A?style=for-the-badge&labelColor=0F172A&color=00D9A5" height="48" alt="ResQFlow"/>

<h1>ResQFlow</h1>
<h3>Floods Demand Faster. Smarter. Decision.</h3>

<p>A geospatial disaster-response command centre that moves emergency teams from fragmented flood information to prioritised, explainable, operational decisions.</p>

<p>
  <img src="https://img.shields.io/badge/status-decision--support%20prototype-2EA44F?style=for-the-badge&labelColor=0F172A"/>
  <img src="https://img.shields.io/badge/architecture-geospatial%20command%20centre-8B5CF6?style=for-the-badge&labelColor=0F172A"/>
  <img src="https://img.shields.io/badge/decisions-explainable%20heuristics-00D9A5?style=for-the-badge&labelColor=0F172A"/>
  <img src="https://img.shields.io/badge/network-degraded%20mode%20ready-EF4444?style=for-the-badge&labelColor=0F172A"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Django-5.2-092E20?style=flat-square&logo=django&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostGIS-3.5-4169E1?style=flat-square"/>
</p>

<sub><b>Overview</b> &nbsp;·&nbsp; <b>Architecture</b> &nbsp;·&nbsp; <b>Explainability</b> &nbsp;·&nbsp; <b>API</b> &nbsp;·&nbsp; <b>Getting Started</b> &nbsp;·&nbsp; <b>Roadmap</b></sub>

</div>

<br/>

<table align="center">
<tr>
<td align="center" width="20%"><b>6</b><br/><sub>Intelligence Layers</sub></td>
<td align="center" width="20%"><b>100%</b><br/><sub>Explainable Decisions</sub></td>
<td align="center" width="20%"><b>0</b><br/><sub>Black-Box Allocation</sub></td>
<td align="center" width="20%"><b>24h</b><br/><sub>Camp Forecast Horizon</sub></td>
<td align="center" width="20%"><b>5</b><br/><sub>Delivery Phases</sub></td>
</tr>
</table>

<br/>

> **ResQFlow is currently a decision-support prototype.** Resource allocation and camp forecasting use deterministic, explainable heuristics and demo data. They are not trained predictions and should not be treated as a substitute for operational authorisation.

---

## Table of Contents

| | | |
|---|---|---|
| [01 · About](#about) | [08 · Explainability Engine](#explainability-engine) | [15 · Frontend Experience](#frontend-experience) |
| [02 · The Problem](#the-problem) | [09 · Tech Stack](#tech-stack) | [16 · Portfolio, Watchlist & Alerts](#portfolio-watchlist--alerts) |
| [03 · Product Philosophy](#product-philosophy) | [10 · Data Provider Architecture](#data-provider-architecture) | [17 · Project Structure](#project-structure) |
| [04 · Core Differentiator](#core-differentiator) | [11 · Database Schema](#database-schema) | [18 · Getting Started](#getting-started) |
| [05 · System Workflow](#system-workflow) | [12 · API Reference](#api-reference) | [19 · Roadmap](#roadmap) |
| [06 · Multi-Agent Research Pipeline](#multi-agent-research-pipeline) | [13 · Authentication & Authorization](#authentication--authorization) | [20 · Engineering Principles](#engineering-principles) |
| [07 · Evidence Layer & Validation](#evidence-layer--validation) | [14 · Safe Failure Architecture](#safe-failure-architecture) | |

---

## About

ResQFlow is built around one simple idea:

> **During a flood, knowing what is happening is not enough. The system must help determine what needs attention first and where limited resources should go.**

The platform acts as an operational decision layer between incoming disaster information and response teams, combining a modern command-centre frontend, geospatial intelligence, deterministic decision engines, offline emergency capabilities, hydrological modelling, and a resilient backend architecture.

**Core capabilities**

| Category | Capabilities |
|---|---|
| **Triage & Allocation** | SOS request triage, explainable rescue-resource allocation, resource capability & availability tracking |
| **Relief Operations** | Relief-camp capacity monitoring, camp demand forecasting, food/water stock monitoring, medical-load assessment |
| **Flood Intelligence** | Flood-risk and inundation visualization, hydrological modelling, flood-depth estimation, GeoJSON/GeoTIFF outputs |
| **Field & Resilience** | Field-feedback capture, offline emergency navigation, offline safehouse lookup, CAP 1.2 alert generation, degraded-network operation |

The main command centre brings these capabilities together into a unified operational view.

---

## The Problem

Flood response is fundamentally a **time + information + resource allocation problem**. Emergency teams face many SOS requests arriving simultaneously, limited rescue vehicles and boats, incomplete information about available resources, changing flood conditions, constrained relief-camp capacity, limited food and water, medical-resource bottlenecks, unreliable connectivity, and geographically distributed response teams.

The challenge is therefore not simply *"Will this area flood?"* — it is:

> **"Who needs help first, what resources are available, where should they go, and which relief locations are likely to become overloaded?"**

### The Response Gap vs. ResQFlow's Approach

```mermaid
flowchart LR
    subgraph GAP["The Response Gap"]
        direction LR
        A1["Scattered Information"] --> A2["Manual Interpretation"] --> A3["Delayed Prioritisation"] --> A4["Resource Mismatch"] --> A5["Slower Response"] --> A6["Higher Operational Risk"]
    end

    subgraph FLOW["ResQFlow's Approach"]
        direction LR
        B1["Incoming Data"] --> B2["Unified Command Centre"] --> B3["Flood + SOS Intelligence"] --> B4["Explainable Prioritisation"] --> B5["Resource Matching"] --> B6["Camp Readiness"] --> B7["Field Feedback"] --> B8["Continuous Operational Update"]
    end

    classDef bad fill:#EF4444,stroke:#B91C1C,color:#fff,stroke-width:2px
    classDef good fill:#00D9A5,stroke:#047857,color:#0F172A,stroke-width:2px

    class A1,A2,A3,A4,A5,A6 bad
    class B1,B2,B3,B4,B5,B6,B7,B8 good
```

---

## Product Philosophy

ResQFlow follows five product principles.

```mermaid
flowchart TD
    A["Decision Support over Black-Box Automation"] --> F["Operator Retains Control"]
    B["Explainability by Default"] --> F
    C["Geography as a First-Class Data Type"] --> F
    D["Graceful Degradation"] --> F
    E["Operational Clarity over Feature Overload"] --> F

    classDef principle fill:#8B5CF6,stroke:#5B21B6,color:#fff,stroke-width:2px
    classDef outcome fill:#00D9A5,stroke:#047857,color:#0F172A,stroke-width:2px

    class A,B,C,D,E principle
    class F outcome
```

**1. Decision support over black-box automation.** The system recommends actions, but the controller remains in control. Every allocation recommendation exposes human-readable reasons so an operator can validate, override, or reject it.

**2. Explainability by default.** A recommendation without context is difficult to trust during an emergency. ResQFlow exposes the factors behind resource-ranking and camp-risk decisions.

**3. Geography is a first-class data type.** Flood response is inherently spatial. SOS requests, rescue resources, camps and flood zones are represented geographically and processed using PostGIS and geospatial tooling.

**4. Failure should degrade gracefully.** Emergency software cannot assume perfect connectivity. When the backend is unavailable, the frontend continues using typed demo fixtures, and the dedicated offline SOS subsystem can operate without network connectivity.

**5. Operational clarity over feature overload.** The interface is designed around the responder's questions — what is happening, who needs help, what is closest, what resource should be assigned, which camp is under pressure, where is flooding likely to spread, what should happen next.

---

## Core Differentiator

Most disaster platforms tend to focus on one layer — prediction, mapping, incident management, or resource tracking. ResQFlow connects these layers into one operational loop.

### The ResQFlow Decision Stack

```mermaid
flowchart TD
    A["Flood Intelligence<br/>Rainfall · Soil · Terrain · Inundation"] --> B["Incident Intelligence<br/>SOS · Severity · Location · Status"]
    B --> C["Resource Intelligence<br/>Distance · Capability · Capacity · ETA"]
    C --> D["Relief Intelligence<br/>Capacity · Food · Water · Medical Load"]
    D --> E["Field Intelligence<br/>Feedback · Status · Operational Updates"]

    classDef layer fill:#0EA5E9,stroke:#0369A1,color:#fff,stroke-width:2px
    class A,B,C,D,E layer
```

The differentiator is not a single model. It is the **integration of geospatial intelligence, explainable decision logic, emergency workflows and resilient operation into one response system**.

---

## System Workflow

### End-to-End Operational Flow

```mermaid
flowchart LR
    A["External / Field<br/>Data Sources"] --> B["Data Ingestion Layer<br/>Rain · Soil · DEM · SOS"]
    B --> C["Geospatial Intelligence<br/>Terrain + Hydrology"]
    C --> D["Flood Intelligence<br/>Runoff + Inundation"]
    D --> E["SOS Requests"]
    D --> F["Relief Camps"]
    E --> G["SOS Triage"]
    F --> H["Camp Forecasting"]
    G --> I["Resource Recommendation"]
    H --> J["Camp Risk Assessment"]
    I --> K["Command Centre<br/>Operator Decision"]
    J --> K
    K --> L["Dispatch / Action"]
    L --> M["Field Feedback"]
    M --> N["Updated State"]

    classDef ingest fill:#8B5CF6,stroke:#5B21B6,color:#fff,stroke-width:2px
    classDef intel fill:#0EA5E9,stroke:#0369A1,color:#fff,stroke-width:2px
    classDef branch fill:#F59E0B,stroke:#B45309,color:#fff,stroke-width:2px
    classDef decide fill:#00D9A5,stroke:#047857,color:#0F172A,stroke-width:2px
    classDef action fill:#22C55E,stroke:#15803D,color:#fff,stroke-width:2px

    class A,B ingest
    class C,D intel
    class E,F,G,H,I,J branch
    class K decide
    class L,M,N action
```

### Runtime Architecture

ResQFlow uses a three-tier architecture. The browser never receives the Django/database credentials — the Next.js catch-all route forwards requests to Django through the server-only `DJANGO_API_URL`.

```mermaid
flowchart LR
    A["Browser"] -- "same-origin /backend/*" --> B["Next.js Frontend"]
    B -- "server-side proxy" --> C["Django REST API"]
    C --> D["PostgreSQL + PostGIS"]

    classDef client fill:#8B5CF6,stroke:#5B21B6,color:#fff,stroke-width:2px
    classDef server fill:#0EA5E9,stroke:#0369A1,color:#fff,stroke-width:2px
    classDef db fill:#22C55E,stroke:#15803D,color:#fff,stroke-width:2px

    class A client
    class B,C server
    class D db
```

---

## Multi-Agent Research Pipeline

> **Current status: Architecture direction / not implemented in the supplied prototype.**

A future ResQFlow intelligence layer can evolve the deterministic decision engines into specialised, cooperating agents — remaining **human-supervised**, especially for high-impact emergency decisions.

### Proposed Agent Architecture

```mermaid
flowchart TD
    A["Incident Agent"] --> D["Decision Agent"]
    B["Flood Agent"] --> D
    C["Resource Agent"] --> D
    D --> E["Relief Agent"]
    E --> F["Human Controller"]

    classDef agent fill:#8B5CF6,stroke:#5B21B6,color:#fff,stroke-width:2px
    classDef decide fill:#F59E0B,stroke:#B45309,color:#fff,stroke-width:2px
    classDef human fill:#22C55E,stroke:#15803D,color:#fff,stroke-width:2px

    class A,B,C,E agent
    class D decide
    class F human
```

| Agent | Proposed Responsibility |
|---|---|
| **Flood Intelligence Agent** | Interpret rainfall, terrain and inundation outputs |
| **Incident Agent** | Prioritise incoming SOS requests |
| **Resource Agent** | Identify available response resources |
| **Relief Agent** | Assess camp readiness and projected demand |
| **Decision Agent** | Synthesise evidence into an operational recommendation |

---

## Evidence Layer & Validation

ResQFlow's current decision layer is intentionally deterministic. Rather than returning an opaque score, the system exposes the full reasoning chain behind every recommendation.

```mermaid
flowchart LR
    A["Recommended Resource"] --> B["Distance Factor"]
    A --> C["Capability Match"]
    A --> D["Capacity Match"]
    A --> E["Verification Status"]
    A --> F["Resource Category"]
    A --> G["Estimated ETA"]
    B --> H["Human-Readable Rationale"]
    C --> H
    D --> H
    E --> H
    F --> H
    G --> H

    classDef factor fill:#0EA5E9,stroke:#0369A1,color:#fff,stroke-width:2px
    classDef rationale fill:#00D9A5,stroke:#047857,color:#0F172A,stroke-width:2px

    class A,B,C,D,E,F,G factor
    class H rationale
```

For resource allocation, the recommendation engine considers Haversine distance, livestock capability, medical capability, resource capacity versus party size, verification status, official versus civilian category, and estimated ETA based on resource type. Each recommendation contains the reasons behind its score so a controller can confirm or override it.

Camp forecasts similarly expose projected arrivals, food consumption, water consumption, projected occupancy, people-per-medic load, resulting risk level, and recommended actions.

---

## Explainability Engine

The explainability layer is one of the central design principles of ResQFlow.

### Resource Recommendation

```mermaid
flowchart TD
    A["Resource Candidate"] --> B["Distance"]
    A --> C["Capability"]
    A --> D["Capacity"]
    A --> E["Verification"]
    A --> F["Resource Category"]
    A --> G["ETA"]
    B --> H["Deterministic Score"]
    C --> H
    D --> H
    E --> H
    F --> H
    G --> H
    H --> I["Human-Readable Reasons"]
    I --> J["Controller Confirmation"]
    J -- Assign --> K["Dispatched"]
    J -- Override --> L["Manual Reassignment"]

    classDef factor fill:#0EA5E9,stroke:#0369A1,color:#fff,stroke-width:2px
    classDef score fill:#F59E0B,stroke:#B45309,color:#fff,stroke-width:2px
    classDef human fill:#8B5CF6,stroke:#5B21B6,color:#fff,stroke-width:2px
    classDef outcome fill:#22C55E,stroke:#15803D,color:#fff,stroke-width:2px

    class A,B,C,D,E,F,G factor
    class H score
    class I,J human
    class K,L outcome
```

### Camp Risk

Camp demand is projected across **6, 12, and 24 hours**. The system evaluates projected occupancy, food/water stock and medical load and assigns a severity level with reasons and recommended actions.

```mermaid
flowchart LR
    A["Projected Occupancy"] --> E["Risk Classification"]
    B["Food / Water Stock"] --> E
    C["Medical Load"] --> E
    E --> F["CRITICAL"]
    E --> G["HIGH"]
    E --> H["WATCH"]
    E --> I["STABLE"]

    classDef input fill:#0EA5E9,stroke:#0369A1,color:#fff,stroke-width:2px
    classDef critical fill:#EF4444,stroke:#B91C1C,color:#fff,stroke-width:2px
    classDef high fill:#F59E0B,stroke:#B45309,color:#fff,stroke-width:2px
    classDef watch fill:#F59E0B,stroke:#B45309,color:#fff,stroke-width:2px
    classDef stable fill:#22C55E,stroke:#15803D,color:#fff,stroke-width:2px

    class A,B,C input
    class F critical
    class G high
    class H watch
    class I stable
```

---

## Tech Stack

<table>
<tr>
<td valign="top" width="25%">

**Frontend**

<img src="https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/React%2019-149ECA?style=for-the-badge&logo=react&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/Radix%20UI%20%2B%20shadcn%2Fui-000000?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/Recharts-8884D8?style=for-the-badge"/>

</td>
<td valign="top" width="25%">

**State & Forms**

<img src="https://img.shields.io/badge/React%20Context-149ECA?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/Zustand-433E38?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/react--hook--form-EC5990?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge"/>

</td>
<td valign="top" width="25%">

**Backend & Data**

<img src="https://img.shields.io/badge/Django%205.2-092E20?style=for-the-badge&logo=django&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/Django%20REST%20Framework-A30000?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/GeoDjango-092E20?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/Gunicorn-499848?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/PostgreSQL%2017-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/PostGIS%203.5-4169E1?style=for-the-badge"/>

</td>
<td valign="top" width="25%">

**Hydrology & Deployment**

<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/PyTorch%20%2F%20RunoffLSTM-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/Rasterio%20%2F%20rioxarray-F59E0B?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/GeoPandas%20%2F%20Shapely-F59E0B?style=for-the-badge"/><br/>
<img src="https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white"/><br/>
<img src="https://img.shields.io/badge/Vercel%20%2B%20Render-000000?style=for-the-badge&logo=vercel&logoColor=white"/>

</td>
</tr>
</table>

The hydrology engine includes DEM conditioning, SCS-CN runoff, D8 flow routing, TWI, 2D inundation modelling and flood-alert generation.

---

## Data Provider Architecture

ResQFlow uses a resilient multi-source hydrological ingestion strategy.

| Data Domain | Sources |
|---|---|
| **Rainfall** | GPM / IMERG, Open-Meteo fallback |
| **Soil Moisture** | NASA POWER — `GWETROOT`, `GWETTOP` |
| **Terrain** | DEM — sink filling, slope calculation, D8 flow routing, flow accumulation, Topographic Wetness Index |

### Provider Fallback Chain

```mermaid
flowchart LR
    A["Primary Data Provider"] -- Available --> B["Process"]
    A -- Unavailable --> C["Alternate Provider"]
    C -- Available --> B
    C -- Unavailable --> D["Synthetic Fallback"]
    D --> B

    classDef primary fill:#0EA5E9,stroke:#0369A1,color:#fff,stroke-width:2px
    classDef fallback fill:#F59E0B,stroke:#B45309,color:#fff,stroke-width:2px
    classDef synth fill:#94A3B8,stroke:#475569,color:#0F172A,stroke-width:2px
    classDef process fill:#22C55E,stroke:#15803D,color:#fff,stroke-width:2px

    class A primary
    class C fallback
    class D synth
    class B process
```

The purpose is resilience: degraded upstream data should not automatically bring down the command centre.

---

## Database Schema

PostgreSQL + PostGIS provides the persistence and spatial layer.

```mermaid
erDiagram
    SOS_REQUEST }o--|| RESOURCE : assigned_resource
    SOS_REQUEST ||--o{ FIELD_FEEDBACK : has
    RELIEF_CAMP ||--o{ SOS_REQUEST : services
    FLOOD_ZONE ||--o{ SOS_REQUEST : overlaps
```

**Spatial model.** Geographic fields use PostGIS Geography with WGS 84 (SRID 4326). The API serialises spatial points as:

```json
{
  "lat": 28.6139,
  "lng": 77.2090
}
```

Spatial indexes are used for geographic fields.

**Relationship behaviour.** `SOSRequest.assigned_resource` is optional — if its linked resource is removed, `assigned_resource` is set to `NULL`. Deleting an SOS request cascades to its feedback records.

---

## API Reference

The Django REST API is rooted at `/api/v1/`. The frontend accesses the same API through `/backend/api/v1/*`.

| Endpoint | Description |
|---|---|
| `GET /api/v1/health/` | Checks PostgreSQL/PostGIS connectivity |
| `GET /api/v1/bootstrap/` | Returns the full dashboard snapshot in a single request |
| `/api/v1/sos/` | CRUD operations for SOS requests |
| `POST /api/v1/sos/{id}/assign/` | Transactionally assigns a rescue resource — returns `409` if unavailable |
| `/api/v1/resources/` | CRUD for rescue resources |
| `/api/v1/camps/` | CRUD for relief camps |
| `/api/v1/flood-zones/` | CRUD for flood zones |
| `/api/v1/feedback/` | CRUD for field feedback — a "Rescued" entry releases the assigned resource |

---

## Authentication & Authorization

> **Current status: Not implemented in the supplied prototype.**

The current prototype does not include authentication or role management. For production, the recommended authorization model separates operational responsibilities:

```mermaid
flowchart TD
    A["System Administrator"] --> B["Incident Controller"]
    B --> C["Field Responder"]
    C --> D["Read-Only Observer"]

    classDef role fill:#8B5CF6,stroke:#5B21B6,color:#fff,stroke-width:2px
    class A,B,C,D role
```

Future production requirements should include authenticated sessions, role-based access control, audit logs, privileged action confirmation, secure API credentials, and emergency override policies.

---

## Safe Failure Architecture

> **When dependencies fail, degrade capability instead of collapsing the entire application.**

### API Failure

```mermaid
flowchart TD
    A["Frontend"] --> B{"Django Available?"}
    B -- Yes --> C["PostgreSQL"]
    B -- No --> D["Typed Demo Fixtures"]
    C --> E["source: postgres"]
    D --> F["source: demo"]

    classDef check fill:#F59E0B,stroke:#B45309,color:#fff,stroke-width:2px
    classDef good fill:#22C55E,stroke:#15803D,color:#fff,stroke-width:2px
    classDef fallback fill:#94A3B8,stroke:#475569,color:#0F172A,stroke-width:2px

    class B check
    class C,E good
    class D,F fallback
```

### Offline Emergency Operation

The `/offline-sos` subsystem is designed to continue operating without cellular data, Wi-Fi or upstream cloud connectivity. It uses hardware GNSS, Turf.js spatial calculations, IndexedDB, PWA service workers, cached relief-camp data, and CAP 1.2 XML generation.

---

## Frontend Experience

ResQFlow is organised as an operational command centre rather than a collection of disconnected dashboards.

| Route | Purpose |
|---|---|
| **`/`** — Command Centre | High-level snapshot of SOS requests, available resources, recommendations, system status |
| **`/map`** — Operations Map | Visualises SOS requests, resources, relief camps, flood zones, multiple basemaps |
| **`/sos`** — SOS Operations | Review → Triage → Assign → Dispatch → Update |
| **`/resources`** — Resource Management | Tracks availability, capabilities, resource categories, operational state |
| **`/allocation`** — Allocation | Explainable resource rankings with controller override |
| **`/camps`** — Relief Camps | Tracks capacity, occupancy, supplies, medical load, projected demand |
| **`/field`** — Field Feedback | Records field updates and changes request status |
| **`/analytics`** — Analytics | Prototype response metrics |
| **`/offline`** — Offline | Degraded-network experience |
| **`/demo`** — Demo | Guided prototype walkthrough |

---

## Portfolio, Watchlist & Alerts

> **Current status: Not implemented as a portfolio/watchlist product feature.**

For a future operational intelligence layer, ResQFlow could introduce configurable monitoring views.

| Watchlist | Signal |
|---|---|
| **Incident Watchlist** | High-priority SOS, critical camps, rapidly increasing demand, flooding hotspots, resource shortages |
| **Operational Alerts** | New critical SOS, resource becomes unavailable, camp crosses capacity threshold, food/water stock critical, flood-risk level increases, connectivity degradation |

### Proposed Alert Architecture

```mermaid
flowchart LR
    A["Signal"] --> B["Rule / Intelligence Engine"] --> C["Severity Classification"] --> D["Alert Deduplication"] --> E["Operator Notification"] --> F["Acknowledgement"] --> G["Audit Trail"]

    classDef step fill:#8B5CF6,stroke:#5B21B6,color:#fff,stroke-width:2px
    class A,B,C,D,E,F,G step
```

These capabilities are roadmap items rather than current implemented functionality.

---

## Project Structure

```text
ResQFlow/
├── app/
│   ├── backend/
│   │   └── [...path]/
│   │       └── route.ts
│   └── ...
│
├── src/
│   ├── routes/
│   ├── components/
│   │   ├── aegis/
│   │   └── ui/
│   ├── hooks/
│   └── lib/
│       └── aegis/
│           ├── api.ts
│           ├── data.ts
│           ├── store.tsx
│           ├── mapStore.ts
│           └── campForecast.ts
│
├── backend/
│   ├── aegis_backend/
│   ├── response/
│   │   └── models/
│   └── hydrology_engine/
│
├── public/
│   └── sw.js
│
├── compose.yaml
├── Dockerfile
└── backend/
    └── Dockerfile
```

| Directory | Responsibility |
|---|---|
| `app/` | Next.js App Router entry points |
| `app/backend/` | Same-origin API proxy |
| `src/routes/` | Screen-level UI |
| `src/components/` | Shared UI and map components |
| `src/lib/aegis/` | Domain state and decision logic |
| `backend/response/` | Django models, serializers and views |
| `backend/hydrology_engine/` | Hydrological intelligence |
| `public/sw.js` | PWA service worker |

---

## Getting Started

**Prerequisites**

```text
Node.js
npm
Docker
Docker Compose
Python environment for backend development
```

**Full Stack**

```bash
docker compose up --build
```

```text
Frontend           http://localhost:3000
Django API         http://localhost:8004/api/v1/
Health Check       http://localhost:8004/api/v1/health/
```

**Frontend Development**

```bash
docker compose up --build -d db backend
npm install
npm run dev
```

The local API proxy defaults to `http://127.0.0.1:8004`.

**Verification**

```bash
npm run typecheck
npm run lint
npm run build
docker compose run --rm backend python manage.py test
```

---

## Roadmap

| Phase | Scope |
|---|---|
| **P1 — Prototype Foundation** | Command centre, SOS management, resource tracking, explainable allocation, relief-camp monitoring, camp demand heuristics, flood-risk map, field feedback, offline SOS subsystem, hydrology engine |
| **P2 — Operational Intelligence** | Real-time event ingestion, live sensor integration, production-calibrated forecasting, advanced flood forecasting, automated alerting, real-time communication layer, background processing workers |
| **P3 — Secure Multi-Agency Platform** | Authentication, role-based authorization, audit trails, multi-agency tenancy, secure emergency workflows, permission-aware data sharing |
| **P4 — Advanced Decision Intelligence** | Multi-agent orchestration, evidence aggregation, confidence-aware recommendations, scenario simulation, what-if resource planning, automated incident summarisation |
| **P5 — National-Scale Deployment** | Large-scale geospatial processing, distributed event architecture, production ML model serving, government alert interoperability, regional command-centre federation, disaster-response analytics at scale |

```mermaid
flowchart LR
    A["P1<br/>Prototype Foundation"] --> B["P2<br/>Operational Intelligence"] --> C["P3<br/>Secure Multi-Agency"] --> D["P4<br/>Advanced Decision Intelligence"] --> E["P5<br/>National-Scale Deployment"]

    classDef done fill:#22C55E,stroke:#15803D,color:#fff,stroke-width:2px
    classDef next fill:#F59E0B,stroke:#B45309,color:#fff,stroke-width:2px
    classDef future fill:#94A3B8,stroke:#475569,color:#0F172A,stroke-width:2px

    class A done
    class B next
    class C,D,E future
```

---

## Engineering Principles

| Principle | Over |
|---|---|
| Explainability | Opacity |
| Human-in-the-Loop | Silent Automation |
| Graceful Degradation | Total Collapse |
| Spatial-First Architecture | Location as Metadata |
| Strong Boundaries | Tangled Layers |
| Deterministic Logic | Unnecessary Black Boxes |
| Production-Minded Prototypes | Throwaway Code |
| Fail Safely | Silent Incorrect Action |
| Evidence Before Action | Unsupported Recommendation |
| Built for the Field | Ideal-Condition Assumptions |

**01 — Explainability over opacity.** Every high-impact recommendation should be understandable by the person responsible for acting on it.

**02 — Human-in-the-loop.** Automation should accelerate decisions, not silently replace operational authority.

**03 — Graceful degradation.** External services, databases and networks can fail. The application should degrade safely instead of becoming completely unusable.

**04 — Spatial-first architecture.** Location is not metadata in disaster response — it is core operational state.

**05 — Strong boundaries.** Frontend presentation, client state, API transport, persistence and hydrological processing remain separated.

**06 — Deterministic where possible.** If a rule can be explicit, auditable and reproducible, it should not unnecessarily become a black-box model.

**07 — Production-minded prototypes.** Even prototype components should establish clean interfaces so they can later be replaced with production-grade implementations.

**08 — Fail safely.** Emergency systems should prefer degraded capability over silent incorrect action.

**09 — Evidence before action.** Recommendations should be grounded in observable system state and expose the reasoning behind them.

**10 — Build for the field.** A disaster-response platform must assume unreliable connectivity, incomplete data, rapidly changing conditions, limited resources, and high operational pressure.

---

## ResQFlow at a Glance

```mermaid
flowchart TD
    A["Flood Intelligence<br/>Rainfall · Soil · Terrain · Runoff · Inundation"] --> B["Incident Intelligence<br/>SOS · Priority · Location · Status"]
    B --> C["Resource Intelligence<br/>Distance · Capability · Capacity · ETA"]
    C --> D["Relief Intelligence<br/>Capacity · Food · Water · Medical Load"]
    D --> E["Command Centre<br/>Explain · Prioritise · Assign · Override"]
    E --> F["Field Response<br/>Dispatch · Feedback · Status"]
    F --> G["Resilient Operation<br/>Offline · Degraded Network · Fallback Data"]

    classDef layer fill:#0EA5E9,stroke:#0369A1,color:#fff,stroke-width:2px
    classDef command fill:#8B5CF6,stroke:#5B21B6,color:#fff,stroke-width:2px
    classDef field fill:#00D9A5,stroke:#047857,color:#0F172A,stroke-width:2px

    class A,B,C,D layer
    class E command
    class F,G field
```

**Don't just predict the flood. Understand the flood. Prioritise the people. Deploy the right resources. Prepare the relief network. And keep the response moving when infrastructure fails.**

---

<div align="center">

## Team

**ResQFlow**

Built for the challenge:
**PS3 — Disaster Response Intelligence Platform for flood prediction, emergency planning and resource allocation.**

<br/>

## Prototype Disclaimer

ResQFlow is a research and operational-prototyping system. The current allocation and camp-forecasting components use deterministic heuristics and demo data rather than fully trained predictive models. The prototype does not currently include authentication, role management, real-time messaging, background workers, external alert ingestion or production-trained ML models.

Production deployment would require domain-specific calibration, validated sensor ingestion, security controls, operational authorisation workflows, reliability testing and deployment hardening.

<div align="center">

<br/>

<img src="https://img.shields.io/badge/Explainable-0F172A?style=for-the-badge&labelColor=0F172A&color=00D9A5"/>
<img src="https://img.shields.io/badge/Spatial--First-0F172A?style=for-the-badge&labelColor=0F172A&color=8B5CF6"/>
<img src="https://img.shields.io/badge/Fail%20Safe-0F172A?style=for-the-badge&labelColor=0F172A&color=F59E0B"/>
<img src="https://img.shields.io/badge/Field%20Ready-0F172A?style=for-the-badge&labelColor=0F172A&color=EF4444"/>

<h3>ResQFlow — Faster Signals. Smarter Decisions. Better Response.</h3>

</div>
