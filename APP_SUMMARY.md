# Tennis Tracker App Summary

## What this app does
Tennis Tracker is a full-stack web app that lets players create an account, capture match results, maintain a training journal, and store tennis preferences (including UTR profile data). It combines a React client with an Express API backed by PostgreSQL via Prisma.

## Architecture
- Frontend: React + TypeScript (Vite) with React Router and CSS modules.
- Backend: Bun runtime + Express (TypeScript, ES modules).
- Data: Prisma ORM with a PostgreSQL datasource and a generated client.
- Auth: JWT-based auth stored in an HTTP-only cookie; routes are protected with middleware.

## Data model
- User: email, password hash, optional first/last name.
- UserPreferences: one-to-one with User; primary hand, play style, backhand type, UTR rating and profile URL.
- JournalEntry: user-owned entries with title, content, and entry date.
- TennisMatch: user-owned match records with opponent info, date, surface, score, and notes.

## Backend approaches
- Route grouping: dedicated routers for auth, preferences, journal, matches, and UTR under `/api/*`.
- Auth middleware: `authenticateToken` reads JWT from `Authorization` header or `access_token` cookie.
- Validation: basic input validation for auth, query-based pagination + sorting validation on list endpoints.
- Pagination: list endpoints return `{ items, total, page, pageSize }` with server-side paging.
- Upsert patterns: preferences and UTR use `upsert` to keep a single record per user.
- Match + journal update/delete: `updateMany`/`deleteMany` scoped by `userId` to avoid cross-user access.

## Frontend approaches
- Auth state: `AuthContext` loads current user on app start and exposes login/logout helpers.
- Routing: protected pages wrapped in a `PrivateRoute` component; home redirects based on auth.
- API client: `ApiService` centralizes fetch calls, enforces JSON headers, and includes cookies.
- Sorting + paging UX: journal and matches pages persist sort in `localStorage` and show paged lists.
- Match score entry: the Matches page validates set scores, tiebreaks, and derives win/loss from sets.
- Theme: simple light/dark toggle stored in `localStorage` and applied via `data-theme`.

## UTR integration approach
- Current implementation reads/writes UTR fields in `UserPreferences` and returns a placeholder response.
- Hooks are in place to call the official UTR API once an API key is configured in `.env`.

## Key entry points
- Backend server: `backend/src/server.ts`
- Prisma client: `backend/src/database.ts`
- Auth middleware: `backend/src/middleware/auth.ts`
- Frontend routing: `frontend/src/App.tsx`
- API client: `frontend/src/services/api.ts`

## Notes
- Passwords are hashed with bcrypt; JWT lifetime is 24h; cookies are HTTP-only with `sameSite=lax`.
- CORS allows a configurable origin list via `CORS_ORIGIN` (comma-separated).
