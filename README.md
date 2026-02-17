# Tennis Tracker App

A full-stack tennis tracking application built with TypeScript, Vite, and Express.

## Features

- **User Authentication**: Secure login and registration with JWT tokens
- **Coach Access**: Students can invite coaches, and coaches can view/comment on profiles, journals, and matches
- **Tennis Preferences**: Track primary hand, play style, and backhand type
- **UTR Integration**: View and manage your Universal Tennis Rating
- **Journal Entries**: Record training notes and reflections
- **Match Tracking**: Log match results, scores, and opponent information

## Tech Stack

### Backend
- Bun runtime with Express (TypeScript)
- Prisma ORM with PostgreSQL
- JWT authentication
- bcrypt for password hashing
- ES Modules

### Frontend
- React with TypeScript
- Vite build tool
- React Router for navigation
- Context API for state management

## Project Structure

```
tennis-tracker/
├── backend/
│   ├── src/
│   │   ├── database.ts          # PostgreSQL database setup
│   │   ├── server.ts            # Express server
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.ts          # Authentication routes
│   │   │   ├── coach.ts         # Coach access routes
│   │   │   ├── preferences.ts   # Preferences routes
│   │   │   ├── journal.ts       # Journal routes
│   │   │   ├── matches.ts       # Match routes
│   │   │   └── utr.ts           # UTR routes
│   │   └── types/
│   │       └── index.ts         # TypeScript types
│   ├── dist/                    # Compiled JavaScript
│   ├── .env                     # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CoachAccess.tsx
│   │   │   ├── CoachDashboard.tsx
│   │   │   ├── CoachStudent.tsx
│   │   │   ├── Preferences.tsx
│   │   │   ├── Journal.tsx
│   │   │   └── Matches.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Bun (v1.2+)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tennis-tracker
```

2. Start the backend:
```bash
cd backend
bun install
bun run dev
```

The backend will run on http://localhost:3001

3. Start the frontend:
```bash
cd frontend
bun install
bun run dev
```

The frontend will run on http://localhost:5173

### Building for Production

Backend:
```bash
cd backend
bun run build
bun run start
```

Frontend:
```bash
cd frontend
bun run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Coach Access
- `POST /api/coach/invites` - Student invites a coach by email
- `GET /api/coach/invites` - Student invite list
- `GET /api/coach/invites/pending` - Coach pending invites
- `POST /api/coach/invites/:id/accept` - Coach accepts invite
- `POST /api/coach/invites/:id/decline` - Coach declines invite
- `GET /api/coach/students` - Coach list of accepted students
- `GET /api/coach/students/:studentId/profile` - Coach view student profile/preferences/comments
- `POST /api/coach/students/:studentId/profile/comments` - Coach adds profile comment
- `GET /api/coach/students/:studentId/journals` - Coach view journal entries
- `POST /api/coach/students/:studentId/journals/:id/comments` - Coach adds journal comment
- `GET /api/coach/students/:studentId/matches` - Coach view matches
- `POST /api/coach/students/:studentId/matches/:id/comments` - Coach adds match comment

### Preferences
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Create/update preferences

### Journal
- `GET /api/journal` - Get all journal entries
- `POST /api/journal` - Create new entry
- `PUT /api/journal/:id` - Update entry
- `DELETE /api/journal/:id` - Delete entry

### Matches
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create new match
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match

### UTR
- `GET /api/utr/my-utr` - Get user's UTR info
- `PUT /api/utr/my-utr` - Update UTR info

## Coach Workflow

### Student
1. Register as a student.
2. Open the Coach Access page from the dashboard.
3. Invite a coach by email.
4. Once accepted, the coach can view your profile, journals, and matches.

### Coach
1. Register as a coach.
2. Open the Coach Dashboard after logging in.
3. Accept or decline pending invites.
4. Open a student profile to review and leave comments.

## TypeScript

This project uses TypeScript throughout:
- Backend: Pure TypeScript with ES modules
- Frontend: React with TypeScript via Vite
- Proper type definitions for all data structures
- Strict TypeScript configuration

## UTR API Integration

To integrate with the official UTR API:

1. Sign up for API access at https://app.universaltennis.com
2. Add your API key to the backend `.env` file:
   ```
   UTR_API_KEY=your-api-key
   ```
3. Update the UTR routes in `/backend/src/routes/utr.ts` to make actual API calls

## License

MIT
