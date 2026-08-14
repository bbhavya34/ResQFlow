# Aegis Bharat Response

Prototype disaster-response command centre aligned to the proposed production stack.

## Implemented stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Maps:** Leaflet with OpenStreetMap tiles
- **Backend:** Django and Django REST Framework
- **Database:** PostgreSQL 17 with PostGIS 3.5 spatial fields and indexes
- **API integration:** same-origin Next.js proxy with PostgreSQL-backed reads and writes
- **Fallback:** typed in-memory fixtures when the backend is unavailable
- **Allocation and routing demo:** deterministic, explainable TypeScript heuristics
- **Deployment:** Docker Compose services for frontend, backend and database

## Next phase

- **Resource allocation:** Google OR-Tools
- **Routing graph:** NetworkX
- **Realtime:** WebSockets backed by Redis
- **Background jobs:** Celery

## Explicitly deferred

AI/ML and data-science dependencies (Python models, scikit-learn, XGBoost, Pandas, NumPy and GeoPandas) are intentionally excluded from this prototype. Current risk scores, recommendations and analytics use demo fixtures and deterministic rules only; they are not predictive models.

## Run the complete stack

```bash
docker compose up --build
```

Open `http://localhost:3000`. The Django API is available at
`http://localhost:8000/api/v1/`, and PostgreSQL is exposed on port `5432`.

The backend automatically applies migrations and idempotently seeds demo data.

## Run frontend development locally

```bash
docker compose up --build -d db backend
npm install
npm run dev
```

The frontend proxies `/backend/*` to `DJANGO_API_URL`, which defaults to
`http://127.0.0.1:8000` for local development.

## API endpoints

- `GET /api/v1/health/` verifies PostgreSQL and returns the PostGIS version.
- `GET /api/v1/bootstrap/` returns the dashboard snapshot.
- CRUD endpoints: `/sos/`, `/resources/`, `/camps/`, `/flood-zones/`, `/feedback/`.
- `POST /api/v1/sos/{id}/assign/` transactionally assigns a resource.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
docker compose run --rm backend python manage.py test
```
