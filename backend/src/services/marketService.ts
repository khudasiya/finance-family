import { db } from '../db/client.js';
import { MarketTrend } from './budgetSplit.js';

export interface MarketSnapshotRecord {
  id: number;
  date: string;
  index_value: number;
  trend_direction: MarketTrend;
  change_percent: number;
}

/**
 * Retrieves the current market snapshot from the database.
 * If no snapshot exists, creates a fresh default snapshot.
 */
export async function getCurrentMarketSnapshot(): Promise<MarketSnapshotRecord> {
  const today = new Date().toISOString().split('T')[0];
  const res = await db.query<MarketSnapshotRecord>(
    `SELECT * FROM market_snapshots ORDER BY date DESC, id DESC LIMIT 1`
  );

  if (res.rows.length > 0) {
    return {
      ...res.rows[0],
      index_value: Number(res.rows[0].index_value),
      change_percent: Number(res.rows[0].change_percent)
    };
  }

  // Create default snapshot if none exists
  const defaultSnapshot: MarketSnapshotRecord = {
    id: 1,
    date: today,
    index_value: 24500.0,
    trend_direction: 'BULLISH',
    change_percent: 1.2
  };

  await db.query(
    `INSERT INTO market_snapshots (date, index_value, trend_direction, change_percent)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (date) DO NOTHING`,
    [defaultSnapshot.date, defaultSnapshot.index_value, defaultSnapshot.trend_direction, defaultSnapshot.change_percent]
  );

  return defaultSnapshot;
}

/**
 * Gets market snapshot history for visualization line chart.
 */
export async function getMarketHistory(): Promise<MarketSnapshotRecord[]> {
  const res = await db.query<MarketSnapshotRecord>(
    `SELECT * FROM market_snapshots ORDER BY date ASC LIMIT 30`
  );
  return res.rows.map(r => ({
    ...r,
    index_value: Number(r.index_value),
    change_percent: Number(r.change_percent)
  }));
}

/**
 * Updates or simulates a market signal change.
 */
export async function updateMarketTrend(
  trend: MarketTrend,
  customIndexValue?: number
): Promise<MarketSnapshotRecord> {
  const today = new Date().toISOString().split('T')[0];
  const current = await getCurrentMarketSnapshot();

  const newIndex = customIndexValue !== undefined
    ? customIndexValue
    : trend === 'BULLISH'
    ? Number((current.index_value * 1.015).toFixed(2))
    : trend === 'BEARISH'
    ? Number((current.index_value * 0.985).toFixed(2))
    : current.index_value;

  const changePercent = Number((((newIndex - 24000) / 24000) * 100).toFixed(2));

  await db.query(
    `INSERT INTO market_snapshots (date, index_value, trend_direction, change_percent)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (date) DO UPDATE SET
       index_value = EXCLUDED.index_value,
       trend_direction = EXCLUDED.trend_direction,
       change_percent = EXCLUDED.change_percent`,
    [today, newIndex, trend, changePercent]
  );

  return getCurrentMarketSnapshot();
}
