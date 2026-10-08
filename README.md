# CivicAI – AI-Powered Civic Issue Intelligence & Resolution Platform

Report → AI analyses → Classified → Severity/priority → Duplicate detection → Department routed → Officer acts → Resolved → Citizen verifies → Analytics.

## Features
- Roles: Citizen, Officer, Admin (JWT, bcrypt-style hashed passwords via Werkzeug, role-based API protection)
- AI: category, severity (Low/Medium/High/Critical), priority 0–100, department routing, duplicate detection (same category + ≤50 m, or ≤150 m with similar text), civic assistant
- Works **without** an API key (built-in keyword engine). Add `AI_API_KEY` for real AI incl. photo analysis
- Image upload (JPG/PNG ≤5 MB, validated by extension + file signature), before/after resolution photos
- Dashboards (citizen/officer/admin with Recharts), Leaflet + OpenStreetMap severity map (no paid API)
- In-app notifications, status history, feedback/rating, reopen
- Admin: users, departments, reassign, delete, analytics, department performance

## Tech stack
React + Vite + Tailwind + React Router + Axios + Lucide + Recharts + Leaflet | Flask + SQLAlchemy + Flask-JWT-Extended + Flask-CORS | SQLite (set `DATABASE_URL` for PostgreSQL; add `psycopg2-binary` to requirements).

## Folder structure
```
backend/  run.py  seed.py  requirements.txt  .env.example  uploads/
  app/__init__.py (app factory, CORS, errors)  models.py  routes.py (all REST APIs)
  app/ai/service.py   <- the ONLY file to edit to change AI provider
frontend/ src/{pages,components,App.jsx,api.js,AuthContext.jsx}  vite.config.js (proxies /api -> :5000)
```

## Requirements
Python 3.10+ (tick "Add to PATH" on install), Node.js 18+ LTS, VS Code.

## Setup (Windows PowerShell)
Terminal 1 – backend:
```powershell
cd civic-intelligence-platform\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed.py
python run.py
```
Terminal 2 – frontend:
```powershell
cd civic-intelligence-platform\frontend
npm install
npm run dev
```
Open http://localhost:5173

If PowerShell blocks `Activate.ps1`:
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` (answer Y), then retry.

## Environment variables (backend/.env)
| Variable | Purpose |
|---|---|
| SECRET_KEY | Flask signing secret (any long random text) |
| JWT_SECRET_KEY | Login-token secret (32+ chars) |
| AI_API_KEY | Optional Anthropic API key (console.anthropic.com). Empty = built-in AI fallback |
| AI_MODEL | Optional model name (default claude-sonnet-4-6) |
| DATABASE_URL | Optional; default SQLite file `backend/civic.db` |
| FRONTEND_ORIGIN | Allowed CORS origin, default http://localhost:5173 |

Keys live only in the backend; the frontend never sees them. After editing `.env`, restart the backend.

## Database
Tables are created automatically on first start and demo data is auto-loaded. `python seed.py` wipes and reloads demo data.

## Demo accounts (password `Demo@123`)
| Role | Email |
|---|---|
| Citizen | citizen@civic.demo (also citizen2@, citizen3@) |
| Admin | admin@civic.demo |
| Officer – Roads & Engineering | officer@civic.demo |
| Officer – Sanitation / Water / Drainage / Electrical / Parks / General | officer2@ … officer7@civic.demo |

## API overview (all under /api, JWT `Authorization: Bearer <token>`)
Auth: POST auth/register, auth/login, auth/logout; GET auth/me
Complaints: GET/POST complaints; GET/PUT/DELETE complaints/:id; POST complaints/:id/{analyze,status,resolve,verify,reopen}; GET map
AI: POST ai/preview, assistant
Other: GET notifications, POST notifications/read; GET/POST/PUT/DELETE departments, users; GET dashboard/{citizen|officer|admin}, analytics; GET uploads/:file

## Troubleshooting
- `python` not found → reinstall Python with "Add to PATH", reopen VS Code.
- Port 5000/5173 busy → close other apps or change the port in run.py / vite.config.js.
- "Cannot reach the server" → backend terminal must be running.
- Blank map → needs internet (OpenStreetMap tiles).
- Changed models and get DB errors → stop backend, delete `backend/civic.db`, run `python seed.py`.
- AI not used → check `AI_API_KEY` in `.env`, restart backend; fallback is used silently on failure.

## Stop / restart
Press `Ctrl+C` in each terminal. Restart with `python run.py` (venv activated) and `npm run dev`.

## Known limits (MVP)
Complaint categories are fixed in code (editable in `app/ai/service.py`), not a database table. Notifications are in-app only. Image uploads are stored on local disk.
