import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import preferencesRoutes from './routes/preferences.js';
import journalRoutes from './routes/journal.js';
import matchesRoutes from './routes/matches.js';
import utrRoutes from './routes/utr.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/utr', utrRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Tennis Tracker API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
