import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import appsRouter from './routes/apps.js';
import reportsRouter from './routes/reports.js';
import { runMigrations } from './db/migrations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/apps', appsRouter);
app.use('/api/reports', reportsRouter);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server immediately, run migrations in background
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  
  // Run migrations in background (non-blocking)
  runMigrations().catch((err) => {
    console.error('Migration error (non-fatal):', err);
  });
});

