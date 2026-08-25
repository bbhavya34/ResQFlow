# ResQFlow

ResQFlow is a prototype command centre for coordinating flood-response work:
triaging SOS requests, locating available rescue resources, tracking relief
camps, recording field feedback, and visualising flood-risk areas.

It is a decision-support prototype. Allocation scores and camp forecasts use
deterministic, explainable rules and demo data; they are not trained predictions
or a substitute for operational authorisation.

## System architecture

```mermaid
flowchart LR
  operator["Operator browser"] --> vercel["Vercel: Next.js frontend"]
  vercel --> proxy["/backend/* proxy route"]
  proxy --> django["Render: Django REST API"]
  django --> postgis["Render PostgreSQL + PostGIS"]
  vercel --> maps["OpenFloodGauge or Esri map tiles"]
  django --> seed["Migrations and demo-data seed"]
```

The browser calls the same-origin `/backend/api/v1/*` path. A Next.js route
handler forwards that request to Django using the server-only `DJANGO_API_URL`.
If the API is unavailable, the frontend continues with typed in-memory demo
fixtures.

## Operational workflow

```mermaid
flowchart TD
  report["SOS received"] --> triage["Triage request and calculate priority"]
  triage --> match["Rank available resources"]
  match --> decision["Controller confirms or overrides assignment"]
  decision --> dispatch["Set request to assigned or dispatched"]
  dispatch --> field["Field team submits feedback"]
  field --> resolved["Mark rescued or return request to triage"]
  camps["Camp capacity and supplies"] --> decision
  flood["Flood zones and map layers"] --> triage
```

## Data model

```mermaid
erDiagram
  RESCUE_RESOURCE o|--o{ SOS_REQUEST : "assigned to"
  SOS_REQUEST ||--o{ FEEDBACK_ENTRY : "has"
  SOS_REQUEST {
    string id PK
    point location
    string status
    int people
    boolean medical
    float flood_depth_m
  }
  RESCUE_RESOURCE {
    string id PK
    point location
    string availability
    int capacity
    json capabilities
  }
  RELIEF_CAMP {
    string id PK
    point location
    int capacity
    int occupancy
    string status
  }
  FLOOD_ZONE {
    string id PK
    point center
    string risk
    float probability
  }
  FEEDBACK_ENTRY {
    string id PK
    string sos_id FK
    string type
    string by
    string note
  }
```

All geographic fields are PostGIS points in WGS 84 (`SRID 4326`) with spatial
indexes. `SOSRequest.assigned_resource` is optional and becomes `NULL` if the
linked resource is removed. Deleting an SOS request deletes its feedback.

## Stack

| Layer               | Technology                                          |
| ------------------- | --------------------------------------------------- |
| Frontend            | Next.js App Router, React, TypeScript, Tailwind CSS |
| Client state        | React context with typed demo fallback              |
| Maps                | Leaflet with OpenFloodGauge or Esri tiles           |
| API                 | Django 5, Django REST Framework, Gunicorn           |
| Database            | PostgreSQL 17 with PostGIS 3.5                      |
| Local orchestration | Docker Compose                                      |
| Production          | Vercel frontend, Render Django API and PostgreSQL   |

## Main screens

- **Command Centre** — snapshot of requests, resources, recommendations, and
  system status.
- **Operations Map** — SOS, resource, camp, and flood-zone layers.
- **SOS Requests** — review, triage, assign, dispatch, and update requests.
- **Resources** — rescue-resource availability and capability tracking.
- **Allocation** — explainable resource ranking and controller override.
- **Relief Camps** — capacity, supply, medical-load, and demand views.
- **Field Feedback** — record field updates and change request status.
- **Analytics, Connectivity, Demo Run** — prototype analytics and offline/demo
  experiences.

## API

The Django API is rooted at `/api/v1/`.

| Endpoint                        | Purpose                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| `GET /api/v1/health/`           | Confirms PostgreSQL/PostGIS connectivity. Use this for uptime monitoring. |
| `GET /api/v1/bootstrap/`        | Returns the dashboard snapshot.                                           |
| `/api/v1/sos/`                  | CRUD for SOS requests.                                                    |
| `POST /api/v1/sos/{id}/assign/` | Transactionally assigns a rescue resource.                                |
| `/api/v1/resources/`            | CRUD for rescue resources.                                                |
| `/api/v1/camps/`                | CRUD for relief camps.                                                    |
| `/api/v1/flood-zones/`          | CRUD for flood zones.                                                     |
| `/api/v1/feedback/`             | CRUD for field feedback.                                                  |

The Next.js client accesses the same endpoints through
`/backend/api/v1/*`; do not expose Django database credentials to the browser.

## Run locally

### Full stack with Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Django API: `http://localhost:8001/api/v1/`
- Health check: `http://localhost:8001/api/v1/health/`

### Frontend development

```bash
docker compose up --build -d db backend
npm install
npm run dev
```

The frontend uses `http://127.0.0.1:8001` by default for the API proxy.


## Verify

```bash
npm run typecheck
npm run lint
npm run build
docker compose run --rm backend python manage.py test
```

## Repository layout

```text
app/                 Next.js routes and backend proxy route
src/components/      Shared application and UI components
src/routes/          Screen-level client components
src/lib/aegis/       Client API, data, state, maps, and allocation logic
backend/             Django project, REST API, migrations, and seed command
compose.yaml         Local frontend, backend, and PostGIS services
Dockerfile           Frontend Docker image
backend/Dockerfile   Django Docker image
```

## Prototype limits

- Demo records are seeded automatically and frontend fallback data is available.
- Allocation, risk, and camp forecasts are deterministic heuristics.
- No authentication, role management, real-time messaging, background workers,
  external alert ingestion, or trained ML models are included.
