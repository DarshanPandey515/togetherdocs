# TogetherDocs

A Google Docs–style collaborative document editor. Authenticated users create documents, share them with others as viewers or editors, and edit together in real time over WebSockets.

## Features

- JWT signup / login
- Document CRUD and sharing (viewer / editor roles)
- Immutable version history with rollback previews
- Real-time collaborative editing over WebSockets
- Live presence (who is currently viewing a document)
- Optimistic version protocol for concurrent edits

## Tech stack

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Frontend   | React 19, Vite, Tailwind CSS, Froala editor            |
| Backend    | Django 6, Django REST Framework, Django Channels       |
| Realtime   | WebSockets (daphne), Redis channel layer               |
| Data       | PostgreSQL, Redis (presence)                           |
| Hosting    | Vercel (frontend), Render (backend)                    |

## Architecture
```mermaid
flowchart LR
    classDef client fill:#E3F2FD,stroke:#1565C0,stroke-width:1px,color:#0D47A1
    classDef api fill:#FFF3E0,stroke:#EF6C00,stroke-width:1px,color:#E65100
    classDef svc fill:#F3E5F5,stroke:#6A1B9A,stroke-width:1px,color:#4A148C
    classDef data fill:#E8F5E9,stroke:#2E7D32,stroke-width:1px,color:#1B5E20

    subgraph Client["🖥️ Browser"]
        UI["Web UI<br/>React + Froala editor"]
    end

    subgraph Backend["⚙️ Django Backend"]
        direction TB

        subgraph API["API Layer"]
            direction LR
            REST["REST API<br/>auth · docs · sharing · versions"]
            WS["WebSocket Consumer<br/>realtime channel"]
        end

        SVC["Application Services<br/>collaboration engine + versioning"]
    end

    subgraph Data["💾 Data Layer"]
        direction LR
        PG[("PostgreSQL<br/>source of truth")]
        RD[("Redis<br/>presence · pub/sub broadcast")]
    end

    UI -->|"HTTPS /api/*<br/>CRUD, auth, sharing"| REST
    UI <-->|"WSS /ws/documents/:id<br/>live edits, cursors"| WS

    REST --> SVC
    WS --> SVC

    SVC -->|"persist docs & versions"| PG
    WS <-->|"pub/sub fan-out<br/>across server instances"| RD

    class UI client
    class REST,WS api
    class SVC svc
    class PG,RD data
```

The system is a client–server web app split across two deployable halves:

- **Browser** — a React single-page application. Regular actions (signup, login, document list, sharing, version history) use REST; live editing uses a WebSocket connection to the document's realtime channel.
- **REST API** — stateless HTTP endpoints for everything that isn't real time. All requests are authenticated with a JWT access token.
- **Realtime API** — a WebSocket endpoint per document (`/ws/documents/:id`). It authenticates the connection, checks the user can view the document, tracks presence, and routes edit messages to the application services.
- **Application services** — the rules live here: role authorization, the optimistic-version consistency check, and persisting content together with an immutable version snapshot. WebSocket messages never write to the database directly.
- **Data** — PostgreSQL is the source of truth for documents, versions, permissions, and users. Redis handles presence counts and relays broadcasts between connected clients; it never stores document content.

## WebSocket collaboration

```mermaid
sequenceDiagram
    participant A as Client A (editor)
    participant B as Client B (editor)
    participant C as DocumentConsumer
    participant S as CollaborationService
    participant D as Postgres (Document)
    participant R as Redis (presence)

    A->>C: connect wss://…/ws/documents/:id?token=…
    C->>D: authenticate + check view access
    C-->>A: connection.accepted
    C->>R: presence.connect(user_id)
    C-->>A: presence.state [online users]
    C-->>B: presence.join (broadcast)

    Note over A,C: client requests authoritative state before editing
    A->>C: { action: "sync" }
    C->>D: read document
    C-->>A: { type: "state", version, content }

    A->>C: { action: "edit", version=N, content=X }
    C->>S: apply_edit(expected_version=N, content=X)
    S->>D: SELECT … FOR UPDATE, compare version
    alt version matches
        S->>D: persist content, version=N+1 + DocumentVersion row
        C-->>A: { type: "ack", version=N+1 }
        C-->>B: { type: "broadcast", version=N+1, content=X }
    else stale version (conflict)
        C-->>A: { type: "reject", code:"conflict", version, content }
        Note over A: client applies authoritative state
    end
```

### Message protocol

| Direction | Type                | Payload                              |
| --------- | ------------------- | ------------------------------------ |
| Client →  | `{action:"sync"}`   | —                                    |
| Server →  | `state`             | `{ version, content, title }`        |
| Client →  | `{action:"edit"}`   | `{ version, content }`               |
| Server →  | `ack`               | `{ version }`                        |
| Server →  | `reject`            | `{ code, version, content, message }`|
| Server →  | `broadcast`         | `{ version, content, user_id }`      |
| Server →  | `presence.state` / `presence.join` / `presence.leave` | user list / `user_id` |
| Server →  | `error`             | `{ code, message }`                  |

## Key design decisions

- **Optimistic versioning (no OT/CRDT yet).** Every edit carries the base version the client edited from. The server locks the row (`select_for_update`) and accepts only if it matches the current version; otherwise the second writer gets a `reject` containing the latest `{version, content}` for deterministic recovery. This is a correct baseline, not Google-Docs-level merging.
- **Every ACK follows a write.** The `ack` is only sent after `Document` and a `DocumentVersion` snapshot are persisted, so no acknowledged edit is lost.
- **Reconnect = re-sync.** A (re)connecting client must request `sync` to obtain the authoritative `{version, content}` from the database before editing. Redis never holds document content — it is transport/presence only.
- **Presence is ref-counted per user.** Multiple tabs increment a per-user counter; the user only leaves when the last connection drops, so closing one tab doesn't flash another user offline.

## Project structure

```
backend/
  config/            # Django project settings, asgi/wsgi, root urls
  src/
    api/             # REST views, serializers, permissions, urls
    realtime/        # consumers, routing, middleware, presence, redis, protocol
    services/        # collaboration service + versioning service
    models.py        # CustomUser, Document, DocumentPermission, DocumentVersion
    migrations/
frontend/
  src/
    lib/             # api.js (REST client), collab.js (WebSocket client)
    pages/           # AuthPage, Dashboard, Editor
    components/      # presentational components
```

## Local development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in DJANGO_SECRET_KEY, DATABASE_URL, etc.
python manage.py migrate
python manage.py runserver
```

For local development you can point `DATABASE_URL` at a local PostgreSQL or SQLite. Note: `select_for_update()` is a no-op on SQLite, so the concurrency guarantee should be validated on PostgreSQL.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Leave `API_URL` unset locally — Vite proxies `/api` and `/ws` to `localhost:8000` (see `vite.config.js`). Open http://localhost:5173.

## Deployment

### Frontend (Vercel)

Set in the Vercel dashboard: **Environment Variables → `API_URL`** = the backend origin, e.g. `https://your-backend.onrender.com`. No `VITE_` prefix is needed; Vite exposes `API_*` vars via `envPrefix`.

### Backend (Render)

| Variable                | Example                                     |
| ----------------------- | ------------------------------------------- |
| `DJANGO_SECRET_KEY`     | long random string                          |
| `DJANGO_DEBUG`          | `false`                                     |
| `DATABASE_URL`          | `postgresql://user:pass@host:5432/db`       |
| `UPSTASH_REDIS_REST_URL`| `rediss://default:pass@host:6379` (TLS)     |
| `DJANGO_ALLOWED_HOSTS`  | `your-app.onrender.com`                     |
| `CORS_ALLOWED_ORIGINS`  | `https://your-app.vercel.app`               |

The backend runs with `daphne -b 0.0.0.0 -p $PORT config.asgi:application` so WebSockets work in production.

## REST API overview

| Method | Endpoint                                    | Purpose            |
| ------ | ------------------------------------------- | ------------------ |
| POST   | `/api/auth/signup/`                         | Create account     |
| POST   | `/api/auth/login/`                          | JWT login          |
| GET/POST | `/api/documents/`                         | List / create      |
| GET/PUT/PATCH/DELETE | `/api/documents/{id}/`          | Read / update / delete |
| POST   | `/api/documents/permissions/{id}/share/`    | Share with a user  |
| GET    | `/api/documents/{id}/versions/`             | Version history    |

## Roadmap

- Cursor/selection awareness per user
- Operational transform or CRDT merging (currently reject-on-conflict)
- Granular (delta) edit operations instead of full-content broadcast