import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './auth/passport.js';
import { configurePassport } from './auth/passport.js';
import logger from './logger.js';

import authRoutes from './routes/auth.js';
import preferencesRoutes from './routes/preferences.js';
import journalRoutes from './routes/journal.js';
import matchesRoutes from './routes/matches.js';
import utrRoutes from './routes/utr.js';
import coachRoutes from './routes/coach.js';

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

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
    });
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/utr', utrRoutes);
app.use('/api/coach', coachRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Tennis Tracker API is running' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  logger.error('request_error', {
    method: req.method,
    path: req.originalUrl,
    status: res.statusCode || 500,
    message: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
