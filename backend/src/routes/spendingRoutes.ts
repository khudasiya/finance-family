import { Router } from 'express';
import { db } from '../db/client.js';

const router = Router();

// GET spending logs for plan
router.get('/', async (req, res) => {
  try {
    const planId = req.query.plan_id;
    if (!planId) {
      return res.status(400).json({ error: 'plan_id query parameter is required' });
    }

    const planRes = await db.query('SELECT * FROM monthly_plans WHERE id = $1', [planId]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    const plan = planRes.rows[0];

    const logsRes = await db.query(
      'SELECT * FROM spending_logs WHERE plan_id = $1 ORDER BY created_at ASC, id ASC',
      [planId]
    );

    const logs = logsRes.rows.map(l => ({
      ...l,
      essentials_spent: Number(l.essentials_spent),
      discretionary_spent: Number(l.discretionary_spent),
      savings_added: Number(l.savings_added)
    }));

    // Calculate totals
    const totalEssentialsSpent = logs.reduce((sum, l) => sum + l.essentials_spent, 0);
    const totalDiscretionarySpent = logs.reduce((sum, l) => sum + l.discretionary_spent, 0);
    const totalSavingsAdded = logs.reduce((sum, l) => sum + l.savings_added, 0);

    const plannedEssentials = Number(plan.spend_budget);
    const plannedDiscretionary = Number(plan.discretionary_budget);

    const essentialsRemaining = plannedEssentials - totalEssentialsSpent;
    const discretionaryRemaining = plannedDiscretionary - totalDiscretionarySpent;
    const totalUnspentSurplus = essentialsRemaining + discretionaryRemaining;

    let recommendation = '';
    if (totalUnspentSurplus > 0) {
      recommendation = `You have ₹${totalUnspentSurplus.toLocaleString()} unspent surplus remaining from your monthly budget! We recommend moving ₹${Math.round(totalUnspentSurplus * 0.5).toLocaleString()} into Cash Savings and investing ₹${Math.round(totalUnspentSurplus * 0.5).toLocaleString()} into your top priority goal.`;
    } else if (totalUnspentSurplus < 0) {
      recommendation = `You have overspent your planned monthly budget by ₹${Math.abs(totalUnspentSurplus).toLocaleString()}. Rebalance by reducing discretionary purchases next week or drawing from Cash Savings.`;
    } else {
      recommendation = `Your actual spending perfectly matches your planned budget! All allocations are 100% on target.`;
    }

    res.json({
      plan_id: Number(planId),
      logs,
      totals: {
        totalEssentialsSpent,
        totalDiscretionarySpent,
        totalSavingsAdded,
        plannedEssentials,
        plannedDiscretionary,
        essentialsRemaining,
        discretionaryRemaining,
        totalUnspentSurplus
      },
      recommendation
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new spending log entry
router.post('/', async (req, res) => {
  try {
    const {
      plan_id,
      period_type,
      period_name,
      source_type,
      amount,
      category,
      essentials_spent,
      discretionary_spent,
      savings_added,
      notes
    } = req.body;

    if (!plan_id) {
      return res.status(400).json({ error: 'plan_id is required' });
    }

    const type = period_type === 'MONTHLY' ? 'MONTHLY' : (period_type === 'SINGLE' ? 'SINGLE' : 'WEEKLY');
    const name = period_name ? String(period_name).trim() : (type === 'SINGLE' ? (category || 'Expense') : 'Week 1');

    let ess = Number(essentials_spent || 0);
    let disc = Number(discretionary_spent || 0);
    let sav = Number(savings_added || 0);

    if (source_type === 'ESSENTIALS') {
      ess = Number(amount || 0);
    } else if (source_type === 'DISCRETIONARY') {
      disc = Number(amount || 0);
    } else if (source_type === 'SAVINGS') {
      sav = Number(amount || 0);
    }

    const finalNotes = notes || (category ? `Category: ${category}` : '');

    const result = await db.query(
      `INSERT INTO spending_logs
       (plan_id, period_type, period_name, essentials_spent, discretionary_spent, savings_added, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        plan_id,
        type,
        name,
        ess,
        disc,
        sav,
        finalNotes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE spending log entry
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM spending_logs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Spending log entry not found' });
    }
    res.json({ message: 'Spending log deleted', deleted: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
