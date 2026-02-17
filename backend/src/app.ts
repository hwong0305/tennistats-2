import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './auth/passport.js';
import { configurePassport } from './auth/passport.js';

import authRoutes from './routes/auth.js';
import preferencesRoutes from './routes/preferences.js';
import journalRoutes from './routes/journal.js';
import matchesRoutes from './routes/matches.js';
import utrRoutes from './routes/utr.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
configurePassport();
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/utr', utrRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Tennis Tracker API is running' });
});

export default app;
