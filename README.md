# TogetherDocs

A Google Docs-style collaborative editor. **Work in progress** — early development, many features are incomplete.

## Structure

- `backend/` — Django REST API (auth, documents, sharing, versioning)
- `frontend/` — React + Vite app with the Froala rich text editor

## Status

- Backend: JWT signup/login is wired up. `Document`, `DocumentPermission`, and `DocumentVersion` models exist, but the document API is not fully implemented or registered yet.
- Frontend: basic editor screen only; no auth or document screens yet.

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
