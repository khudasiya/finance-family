import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrations.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/authRoutes.js';
import familyRoutes from './routes/familyRoutes.js';
import planRoutes from './routes/planRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import spendingRoutes from './routes/spendingRoutes.js';
import debtRoutes from './routes/debtRoutes.js';
import billRoutes from './routes/billRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/spending', spendingRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/audit', auditRoutes);

async function startServer() {
  try {
    // Run DB migrations & seed
    await runMigrations();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Finance Family Backend API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start backend server:', err);
    process.exit(1);
  }
}

startServer();
