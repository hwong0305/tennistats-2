# Tennis Tracker Frontend

React + TypeScript frontend for the Tennis Tracker app.

## Features
- Student dashboard with matches, journals, preferences, and coach access
- Coach dashboard with pending invites and student profiles
- Coach comments on student profile, journals, and matches

## Getting Started

```bash
bun install
bun run dev
```

The app runs on http://localhost:5173 and expects the backend at `http://localhost:3001` by default.

## Configuration

Override the API URL with:

```bash
VITE_API_URL=http://localhost:3001/api
```

## Scripts
- `bun run dev` - Start the Vite dev server
- `bun run build` - Build for production
- `bun run preview` - Preview the production build
