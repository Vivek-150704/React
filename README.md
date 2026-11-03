# MARS Fines & Fees Management

MARS is a React/Vite frontend backed by a FastAPI service and SQL Server.

## Repository layout

- `frontend/` — React application, pages, shared components, API services, context and styling.
- `backend/app/routers/` — FastAPI route handlers for authentication, dashboard analytics, fines and user management.
- `backend/app/services/` — reusable database/service operations.
- `backend/app/models/` — SQLAlchemy database models.
- `backend/app/schemas/` — Pydantic request/response schemas.
- `backend/app/core/` — database session and authentication/security configuration.

## Local setup

### Backend

1. Open `backend/`.
2. Create and activate a Python virtual environment.
3. Install dependencies: `pip install -r requirement.txt`.
4. Copy `.env.example` to `.env` and configure SQL Server and a strong JWT secret.
5. Start the API from `backend/`: `uvicorn main:app --reload`.
6. API documentation is available at `/docs`.

### Frontend

1. Open `frontend/`.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.
4. Create a production build: `npm run build`.

## Important

- Never commit real `.env` files, credentials, tokens or database passwords.
- The backend requires a reachable SQL Server instance and the configured ODBC driver.
- Do not treat a successful frontend build as proof that database-backed workflows are working; test login, filters, reviews and user management against the configured database.
