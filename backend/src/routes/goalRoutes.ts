import { Router } from 'express';
import { db, withTransaction } from '../db/client.js';
import { rankGoalsAndAllocate } from '../services/goalRanking.js';
import { calculateBudgetSplit } from '../services/budgetSplit.js';
import { getCurrentMarketSnapshot } from '../services/marketService.js';

const router = Router();

// GET goals for family with live dynamic priority ranking & 5-year compounding comparison
router.get('/', async (req, res) => {
  try {
    const familyId = req.query.family_id;
    if (!familyId) {
      return res.status(400).json({ error: 'family_id query parameter is required' });
    }

    // Fetch family
    const famRes = await db.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) {
      return res.status(404).json({ error: 'Family not found' });
    }
    const family = famRes.rows[0];
    const totalIncome = Number(family.total_monthly_income);

    // Get current market snapshot & budget split
    const market = await getCurrentMarketSnapshot();

    // Check if custom budget overrides exist for monthly plan
    const currentMonth = new Date().toISOString().slice(0, 7);
    const planRes = await db.query('SELECT * FROM monthly_plans WHERE family_id = $1 AND month = $2', [familyId, currentMonth]);
    const split = calculateBudgetSplit(totalIncome, market.trend_direction);

    let investBudget = split.amounts.invest_budget;
    let saveBudget = split.amounts.save_budget;

    if (planRes.rows.length > 0) {
      const plan = planRes.rows[0];
      if (plan.invest_budget !== undefined && plan.invest_budget !== null) {
        investBudget = Number(plan.invest_budget);
      }
      if (plan.save_budget !== undefined && plan.save_budget !== null) {
        saveBudget = Number(plan.save_budget);
      }
    }

    // Fetch raw goals
    const goalsRes = await db.query(
      'SELECT * FROM goals WHERE family_id = $1 ORDER BY id ASC',
      [familyId]
    );

    const rawGoals = goalsRes.rows.map(g => ({
      id: g.id,
      description: g.description,
      target_amount: Number(g.target_amount),
      horizon_years: Number(g.horizon_years),
      user_importance: Number(g.user_importance),
      status: g.status,
      custom_allocated_amount: g.custom_allocated_amount !== null && g.custom_allocated_amount !== undefined ? Number(g.custom_allocated_amount) : null
    }));

    // Run Priority Ranking & Investment Allocation Engine with manual override support
    const rankingResult = rankGoalsAndAllocate(
      rawGoals,
      totalIncome,
      investBudget,
      saveBudget,
      market.trend_direction
    );

    // Update calculated scores & ranks in DB transaction
    if (rankingResult.rankedGoals.length > 0) {
      await withTransaction(async (tx) => {
        for (const goal of rankingResult.rankedGoals) {
          await tx.query(
            `UPDATE goals SET
               priority_rank = $1,
               calculated_score = $2,
               allocated_invest_amount = $3
             WHERE id = $4`,
            [goal.priority_rank, goal.calculated_score, goal.allocated_invest_amount, goal.id]
          );
        }
      });
    }

    res.json({
      family,
      market,
      investBucket: investBudget,
      saveBucket: saveBudget,
      rankingResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new goal
router.post('/', async (req, res) => {
  try {
    const { family_id, description, target_amount, horizon_years, user_importance, custom_allocated_amount } = req.body;

    if (!family_id || !description || !target_amount || target_amount <= 0 || !horizon_years || horizon_years <= 0 || !user_importance) {
      return res.status(400).json({ error: 'Description, positive target amount, positive horizon years, and importance (1-10) are required' });
    }

    const customAlloc = custom_allocated_amount !== undefined && custom_allocated_amount !== null && custom_allocated_amount !== '' ? Number(custom_allocated_amount) : null;

    const result = await db.query(
      `INSERT INTO goals (family_id, description, target_amount, horizon_years, user_importance, custom_allocated_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'IN_PROGRESS') RETURNING *`,
      [family_id, description, Number(target_amount), Number(horizon_years), Number(user_importance), customAlloc]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update goal
router.put('/:id', async (req, res) => {
  try {
    const { description, target_amount, horizon_years, user_importance, status, custom_allocated_amount, reset_custom_allocation } = req.body;

    let customAlloc: number | null = null;
    if (reset_custom_allocation) {
      customAlloc = null;
    } else if (custom_allocated_amount !== undefined) {
      customAlloc = custom_allocated_amount !== null && custom_allocated_amount !== '' ? Number(custom_allocated_amount) : null;
    }

    const result = await db.query(
      `UPDATE goals SET
         description = COALESCE($1, description),
         target_amount = COALESCE($2, target_amount),
         horizon_years = COALESCE($3, horizon_years),
         user_importance = COALESCE($4, user_importance),
         status = COALESCE($5, status),
         custom_allocated_amount = CASE WHEN $6::boolean THEN NULL WHEN $7::numeric IS NOT NULL THEN $7::numeric ELSE custom_allocated_amount END
       WHERE id = $8 RETURNING *`,
      [
        description,
        target_amount !== undefined ? Number(target_amount) : null,
        horizon_years !== undefined ? Number(horizon_years) : null,
        user_importance !== undefined ? Number(user_importance) : null,
        status,
        Boolean(reset_custom_allocation),
        customAlloc,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE goal
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM goals WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted', deleted: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
