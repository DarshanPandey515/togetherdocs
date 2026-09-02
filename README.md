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
    subgraph Browser
        UI[React app]
        REST["lib/api.js (fetch)"]
        WS["lib/collab.js (WebSocket)"]
        UI --- REST
        UI --- WS
    end

    subgraph Backend[Django backend]
        subgraph REST_LAYER[REST API]
            VIEWS[api/views.py]
            SER[api/serializers.py]
        end
        subgraph RT[Realtime layer]
            ROUTE[realtime/routing.py]
            AUTH[JWT Auth Middleware]
            CONSUMER[DocumentConsumer]
            PRESENCE[PresenceService]
        end
        SERVICE[services/collaboration.py]
        MODELS[(Document / DocumentVersion / Permissions)]
    end

    REDIS[(Redis)]

    REST -->|"HTTPS /api/*"| VIEWS
    VIEWS --> SER --> MODELS

    WS -->|"WSS /ws/documents/:id"| ROUTE
    ROUTE --> AUTH --> CONSUMER
    CONSUMER --> SERVICE --> MODELS
    CONSUMER --> PRESENCE --> REDIS
    CONSUMER <-->|"channel layer / broadcast"| REDIS
```

The consumer is transport/orchestration code only. All consistency rules (validating an edit, checking the expected version, persisting content + a version snapshot) live in `CollaborationService` — a WebSocket message never calls `Document.save()` directly.

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