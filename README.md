# ResQFlow

ResQFlow is a prototype command centre for coordinating flood-response work:
triaging SOS requests, ranking available rescue resources, tracking relief
camps, forecasting camp demand, recording field feedback, and visualising
flood-risk areas on a live map.

It is a decision-support prototype. Allocation scores and camp forecasts use
deterministic, explainable rules and demo data; they are not trained predictions
or a substitute for operational authorisation.

## System architecture

The runtime has three tiers: a Next.js frontend on Vercel, a Django REST API on
Render, and a PostgreSQL + PostGIS database. The browser only ever talks to its
own origin — a Next.js catch-all route proxies `/backend/*` to Django using the
server-only `DJANGO_API_URL`, so API and database credentials never reach the
client. If the API cannot be reached, the frontend degrades to typed in-memory
demo fixtures and keeps working.

```mermaid
flowchart LR
  operator["Operator browser"]

  subgraph vercel["Vercel — Next.js frontend"]
    ui["App Router pages + screen components"]
    stores["Client state<br/>React Context (domain) + Zustand (map UI)"]
    logic["Client decision logic<br/>allocation ranking + camp demand forecast"]
    proxy["/backend/* proxy route<br/>(server-only)"]
    demo["Typed in-memory demo fixtures"]
  end

  subgraph render["Render"]
    django["Django REST API<br/>DRF + GeoDjango, Gunicorn"]
    postgis[("PostgreSQL 17 + PostGIS 3.5")]
    seed["Migrations + demo-data seed"]
  end

  tiles["Map tiles<br/>OpenFloodGauge · Esri · OSM · CARTO"]

  operator --> ui
  ui --> stores
  ui --> logic
  ui -->|"/backend/api/v1/*"| proxy
  proxy -->|"DJANGO_API_URL"| django
  proxy -. "API unreachable" .-> demo
  django --> postgis
  seed --> postgis
  ui --> tiles
```

Every browser request goes to the same-origin `/backend/api/v1/*` path. The
route handler at `app/backend/[...path]/route.ts` validates the path, forwards
the method, body, and content type to `DJANGO_API_URL` (default
`http://127.0.0.1:8004` in local development), and returns `503` if Django is
unreachable. On load, the client fetches `/bootstrap` for a full snapshot and
records its data source as `loading`, then `postgres` on success or `demo` on
failure.

## Frontend composition and data flow

App Router entry points under `app/` are thin wrappers that render screen
components from `src/routes/`. Shared UI and map components live in
`src/components/`, and all client data, state, and decision logic live in
`src/lib/aegis/`.

```mermaid
flowchart TD
  subgraph pages["app/ — App Router routes"]
    routes["/ · /map · /sos · /resources · /allocation<br/>/camps · /field · /analytics · /offline · /demo"]
  end

  subgraph screens["src/routes + src/components/aegis"]
    screen["Screen components"]
    maps["Leaflet map + basemap switcher"]
  end

  subgraph state["src/lib/aegis — state & logic"]
    ctx["store.tsx — AegisProvider (React Context)<br/>SOS, resources, camps, feedback, recommendations, sync"]
    mapstore["mapStore.ts — Zustand<br/>active basemap, overlays, cursor"]
    forecast["campForecast.ts — camp demand forecast"]
    apimod["api.ts — typed fetch client"]
    seedData["data.ts — types + demo fixtures"]
  end

  routes --> screen
  screen --> maps
  screen --> ctx
  screen --> forecast
  maps --> mapstore
  ctx --> apimod
  ctx -. "fallback" .-> seedData
  forecast --> seedData
  apimod -->|"/backend/api/v1/*"| proxy["Next.js proxy route"]
  proxy --> django["Django REST API"]
```

Domain data — SOS requests, resources, camps, feedback, and the derived resource
recommendations — is held in a React Context provider, `AegisProvider`.
Transient map UI (the active basemap, overlay toggles, and cursor coordinates)
is held in a separate Zustand store, `useMapStore`. The typed fetch client in
`api.ts` talks only to the same-origin proxy; the API exposes `camelCase` fields
and represents every PostGIS point as a `lat`/`lng` pair, and the client types
in `data.ts` mirror that shape exactly.

## Decision logic

Both planning aids are deterministic, explainable heuristics that run entirely
in the browser; the backend handles persistence and transactional state changes,
not scoring.

Resource allocation (`recommendFor` in `store.tsx`) ranks available resources
for each open SOS request using a Haversine distance penalty, capability
matching (livestock, medical), capacity versus party size, verification status,
official-versus-civilian category, and an ETA estimate derived from resource
type. Each recommendation carries the human-readable reasons behind its score so
a controller can confirm or override it.

Camp demand forecasting (`buildCampForecasts` in `campForecast.ts`) projects
arrivals over a 6-, 12-, or 24-hour horizon from active SOS demand in the same
district or state, burns down food and water stock against projected occupancy,
checks people-per-medic load, and assigns each camp a
`CRITICAL`/`HIGH`/`WATCH`/`STABLE` risk with the reasons and recommended actions.

## Operational workflow

```mermaid
flowchart TD
  report["SOS received (APP / SMS / IVR)"] --> triage["Triage and calculate priority"]
  triage --> match["Rank available resources"]
  match --> decision["Controller confirms or overrides assignment"]
  decision --> dispatch["Set request to assigned or dispatched"]
  dispatch --> field["Field team submits feedback"]
  field --> resolved["Mark rescued, or return request to triage"]
  resolved --> closed["Close request"]
  camps["Camp capacity, supplies, demand forecast"] --> decision
  flood["Flood zones and map layers"] --> triage
```

## Data model

```mermaid
erDiagram
  RESCUE_RESOURCE o|--o{ SOS_REQUEST : "assigned to"
  SOS_REQUEST ||--o{ FEEDBACK_ENTRY : "has"
  SOS_REQUEST {
    string id PK
    string channel
    point location "SRID 4326"
    string status
    int people
    int children
    int elderly
    int disabled
    int livestock
    boolean medical
    float flood_depth_m
    json factors
  }
  RESCUE_RESOURCE {
    string id PK
    string type
    string category
    point location "SRID 4326"
    string availability
    int capacity
    json capabilities
    boolean verified
  }
  RELIEF_CAMP {
    string id PK
    point location "SRID 4326"
    int capacity
    int occupancy
    float food_days
    float water_days
    int medical_staff
    string status
  }
  FLOOD_ZONE {
    string id PK
    point center "SRID 4326"
    string risk
    float probability
    float radius_km
  }
  FEEDBACK_ENTRY {
    string id PK
    string sos_id FK
    string type
    string by
    string note
  }
```

All geographic fields are PostGIS geography points in WGS 84 (`SRID 4326`) with
spatial indexes, serialised to and from `lat`/`lng` pairs by the API.
`SOSRequest.assigned_resource` is optional and becomes `NULL` if the linked
resource is removed (`on_delete=SET_NULL`); deleting an SOS request cascades to
its feedback.

## Stack
| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 |
| UI components | Radix UI primitives with shadcn/ui, lucide-react icons |
| Client state | React Context (domain data) + Zustand (map UI state) |
| Forms & validation | react-hook-form with Zod |
| Charts | Recharts (analytics) |
| Maps | Leaflet with five basemaps (OpenFloodGauge, Esri Topo, Esri Terrain, OSM, CARTO Dark) |
| API | Django 5.2, Django REST Framework, GeoDjango, Gunicorn |
| Database | PostgreSQL 17 with PostGIS 3.5 |
| Hydrology & inundation layer | Python package under `backend/hydrology_engine/` for DEM conditioning, SCS-CN runoff, D8 flow routing, TWI, 2D inundation modelling, and flood alert generation |
| ML / forecasting | PyTorch `RunoffLSTM`, precipitation/soil-moisture feature engineering, and synthetic fallback inference paths |
| Geospatial tooling | Rasterio, rioxarray, geopandas, shapely, folium, streamlit |
| Local orchestration | Docker Compose |
| Production | Vercel frontend, Render Django API and PostgreSQL |

## Main screens

- **Command Centre** (`/`) — snapshot of requests, resources, recommendations,
  and system status.
- **Operations Map** (`/map`) — SOS, resource, camp, and flood-zone layers with
  a basemap switcher.
- **Offline SOS Navigation** (`/offline-sos`) — zero-network GNSS compass, local Turf.js spatial routing, IndexedDB safehouse cache, and OASIS CAP 1.2 XML generation.
- **SOS Requests** (`/sos`) — review, triage, assign, dispatch, and update
  requests.
- **Resources** (`/resources`) — rescue-resource availability and capability
  tracking.
- **Allocation** (`/allocation`) — explainable resource ranking with controller
  override.
- **Relief Camps** (`/camps`) — capacity, supplies, medical load, and demand
  forecasts.
- **Field Feedback** (`/field`) — record field updates and change request status.
- **Analytics** (`/analytics`) — prototype response metrics.
- **Connectivity** (`/offline`) — offline and degraded-network experience.
- **Demo Run** (`/demo`) — guided walkthrough of the prototype.

## Offline Flood SOS & Spatial Navigation Engine

ResQFlow incorporates an autonomous, zero-network emergency evacuation and triage subsystem (`/offline-sos`) designed to function when all cellular data, Wi-Fi, and upstream cloud connectivity are completely offline:

```mermaid
flowchart TD
  subgraph hardware["Hardware & OS"]
    gps["GNSS (GPS)"]
    net["Network Interface"]
  end

  subgraph browser["Browser (Offline-First Engine)"]
    direction TB
    subgraph intelligence["Intelligence"]
      routing["Turf.js Routing<br/>(Vector/Bearing)"]
      cap["CAP 1.2 Engine<br/>(XML Alerts)"]
      probe["Connectivity Probe<br/>(Cloudflare Trace + navigator.onLine)"]
    end

    subgraph persistence["Persistence"]
      idb[("IndexedDB<br/>(Safehouse/Camp Cache)")]
      sw["Service Worker<br/>(PWA/Push/Notifications)"]
    end
  end

  subgraph app["ResQFlow Application"]
    ui["Offline SOS UI"]
    store["Aegis Store (React Context)"]
  end

  gps --> routing
  net --> probe
  probe --> store
  store --> idb
  idb --> routing
  routing --> ui
  cap --> ui
  sw --> ui
  store --> sw
```

1. **Client-Side Spatial Math (`@turf/turf`)**:
   * Computes great-circle distance vectors and true compass azimuth bearing angles from hardware GNSS coordinates to all pre-cached relief safehouses.
   * Dynamically renders a rotating SVG compass instrument with 8-point cardinal resolution (`N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`).

2. **Local Storage Cache (`idb` / IndexedDB)**:
   * Replicates central relief camp records (`CAMPS`) into `qflow_emergency_db` on launch.
   * Allows field responders and citizens to query safehouse capacity, occupancy, district, and coordinates completely offline.

3. **OASIS Common Alerting Protocol (CAP v1.2) XML Engine**:
   * Generates standards-compliant OASIS CAP 1.2 XML distress alerts (`src/lib/capGenerator.ts`).
   * Provides direct polygon-delimited geospatial payloads suitable for ingestion by government Cell Broadcast Systems (CBS), NDMA CAP-India (Sachet), and multi-agency emergency relays.

4. **PWA Service Worker (`public/sw.js`)**:
   * Registers persistent, high-priority OS notifications with custom vibration patterns (`requireInteraction: true`) to deliver route instructions even when the browser is backgrounded.
  

## ML-Driven Flood Forecasting & Hydrology Layer

Beyond the zero-network SOS stack, ResQFlow now includes a hydrology intelligence layer that turns rainfall, soil wetness, and terrain data into flood-depth estimates and operational hazard overlays. This layer complements the request-and-allocation workflow by adding a predictive, geospatial early-warning capability for flood-prone districts and river corridors:

```mermaid
flowchart TD
  rain["Rainfall forcing<br/>GPM / Open-Meteo / synthetic fallback"] --> ingest["Data ingestion<br/>NASA POWER + precipitation grids"]
  soil["Soil wetness<br/>GWETROOT / GWETTOP"] --> ingest
  dem["Digital Elevation Model<br/>DEM conditioning + pit filling"] --> terrain["Terrain metrics<br/>slope, D8 flow, accumulation, TWI"]
  ingest --> runoff["SCS-CN runoff engine<br/>P_n = ((P - I_a)^2)/(P - I_a + S)"]
  terrain --> runoff
  runoff --> model["RunoffLSTM<br/>Precipitation + soil + slope -> Q (m^3/s)"]
  model --> inundation["2D diffusion-wave inundation solver<br/>water depth h(x,y,t)"]
  inundation --> mask["Flood mask + risk levels<br/>0-3 severity classes"]
  mask --> ops["GeoJSON / GeoTIFF / dashboard alerts"]
  ops --> ui["Operator view + GIS overlays"]
```

1. **Multi-source hydrological ingestion**:
   * Pulls daily soil moisture fields from NASA POWER (`GWETROOT`, `GWETTOP`) and rainfall grids from GPM/IMERG or Open-Meteo when Earthdata credentials are unavailable.
   * Keeps the pipeline resilient by falling back to synthetic data rather than failing outright, protecting the command centre from downtime during degraded data conditions.

2. **Terrain conditioning and watershed structure**:
   * Uses DEM-based processing to fill sinks, compute slope, route flow with a D8 algorithm, estimate flow accumulation, and calculate Topographic Wetness Index (TWI).
   * These terrain metrics directly affect where water concentrates, drains, and remains ponded during heavy rainfall.

3. **Runoff and discharge modelling**:
   * Combines dynamic soil wetness with SCS-CN runoff theory to compute direct runoff depth over time.
   * Uses a PyTorch `RunoffLSTM` module to estimate basin outlet discharge from precipitation, soil moisture, and terrain slope features, with a synthetic fallback path so the system remains runnable when model weights are not yet trained.

4. **Flood extent and operator actioning**:
   * Solves a simplified 2D shallow-water depth field over the DEM grid to estimate water depth and flood-mask extents.
   * Produces risk levels from 0 to 3, GeoJSON polygons, GeoTIFF raster exports, and map-ready outputs for operator dashboards and GIS ingestion.

This intelligence layer does not replace the field triage workflow; instead, it gives ResQFlow a predictive flood lens and a geospatial decision layer that helps operators anticipate inundation, prioritise vulnerable zones, and coordinate relief before floodwater spreads.


## API

The Django API is rooted at `/api/v1/`. Payloads use `camelCase` fields and
represent locations as `lat`/`lng` pairs.

| Endpoint                        | Purpose                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| `GET /api/v1/health/`           | Confirms PostgreSQL/PostGIS connectivity. Use this for uptime monitoring. |
| `GET /api/v1/bootstrap/`        | Returns the full dashboard snapshot in one call.                          |
| `/api/v1/sos/`                  | CRUD for SOS requests.                                                     |
| `POST /api/v1/sos/{id}/assign/` | Transactionally assigns a rescue resource (`409` if unavailable).         |
| `/api/v1/resources/`            | CRUD for rescue resources.                                                |
| `/api/v1/camps/`                | CRUD for relief camps.                                                     |
| `/api/v1/flood-zones/`          | CRUD for flood zones.                                                      |
| `/api/v1/feedback/`             | CRUD for field feedback; a "Rescued" entry frees the assigned resource.   |

The Next.js client accesses the same endpoints through `/backend/api/v1/*`; do
not expose Django database credentials to the browser.

## Run locally

### Full stack with Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Django API: `http://localhost:8004/api/v1/`
- Health check: `http://localhost:8004/api/v1/health/`

### Frontend development

```bash
docker compose up --build -d db backend
npm install
npm run dev
```

The frontend uses `http://127.0.0.1:8004` by default for the API proxy.


## Verify

```bash
npm run typecheck
npm run lint
npm run build
docker compose run --rm backend python manage.py test
```

## Repository layout

```text
app/                            Next.js App Router routes (thin wrappers)
app/backend/[...path]/route.ts  Same-origin proxy to the Django API
src/routes/                     Screen-level client components
src/components/aegis/           App shell, map, and basemap components
src/components/ui/              shadcn/ui component library
src/hooks/                      Shared React hooks
src/lib/aegis/api.ts            Typed fetch client for the proxy
src/lib/aegis/data.ts           Domain types and demo fixtures
src/lib/aegis/store.tsx         Domain context + resource-recommendation engine
src/lib/aegis/mapStore.ts       Zustand store for map UI state
src/lib/aegis/campForecast.ts   Camp demand-forecast logic
backend/aegis_backend/          Django project settings and URLs
backend/response/               REST API models, serializers, views, and seed command
compose.yaml                    Local frontend, backend, and PostGIS services
Dockerfile                      Frontend Docker image
backend/Dockerfile              Django Docker image
```

## Prototype limits

- Demo records are seeded automatically, and the frontend falls back to typed
  in-memory fixtures when the API is unavailable.
- Allocation, risk, and camp forecasts are deterministic heuristics that run
  client-side, not trained models.
- Map UI state (basemap, overlays) is client-only and is not persisted.
- No authentication, role management, real-time messaging, background workers,
  external alert ingestion, or trained ML models are included.
- The new hydrology engine is a production-ready modular pipeline for research and operational prototyping, but domain-specific calibration, sensor ingestion, and production deployment tuning should still be added for real-world flood forecasting.
