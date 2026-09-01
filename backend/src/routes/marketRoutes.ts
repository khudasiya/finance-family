import { Router } from 'express';
import { getCurrentMarketSnapshot, getMarketHistory, updateMarketTrend } from '../services/marketService.js';
import { db, withTransaction } from '../db/client.js';
import { calculateBudgetSplit } from '../services/budgetSplit.js';

const router = Router();

// GET current market snapshot & history
router.get('/', async (req, res) => {
  try {
    const snapshot = await getCurrentMarketSnapshot();
    const history = await getMarketHistory();
    res.json({ snapshot, history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/market/simulate — Update market trend signal and update active plans in DB
router.post('/simulate', async (req, res) => {
  try {
    const { trend_direction, family_id } = req.body;
    if (!trend_direction || !['BULLISH', 'BEARISH', 'NEUTRAL'].includes(trend_direction)) {
      return res.status(400).json({ error: 'trend_direction must be BULLISH, BEARISH, or NEUTRAL' });
    }

    // 1. Update Market Trend Signal
    const updatedSnapshot = await updateMarketTrend(trend_direction);

    // 2. If family_id provided, update monthly plan for active family with transaction
    if (family_id) {
      const famRes = await db.query('SELECT * FROM families WHERE id = $1', [family_id]);
      if (famRes.rows.length > 0) {
        const family = famRes.rows[0];
        const month = new Date().toISOString().slice(0, 7);
        const split = calculateBudgetSplit(Number(family.total_monthly_income), trend_direction);

        await withTransaction(async (tx) => {
          await tx.query(
            `UPDATE monthly_plans SET
               spend_budget = $1,
               save_budget = $2,
               invest_budget = $3,
               discretionary_budget = $4,
               market_trend = $5
             WHERE family_id = $6 AND month = $7`,
            [
              split.amounts.spend_budget,
              split.amounts.save_budget,
              split.amounts.invest_budget,
              split.amounts.discretionary_budget,
              trend_direction,
              family_id,
              month
            ]
          );
        });
      }
    }

    res.json({
      message: `Market trend signal updated to ${trend_direction}`,
      snapshot: updatedSnapshot
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
