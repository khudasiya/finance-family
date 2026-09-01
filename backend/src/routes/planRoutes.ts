import { Router } from 'express';
import { db, withTransaction } from '../db/client.js';
import { calculateBudgetSplit } from '../services/budgetSplit.js';
import { getCurrentMarketSnapshot } from '../services/marketService.js';
import { solveKnapsack } from '../services/knapsack.js';
import { rankGoalsAndAllocate } from '../services/goalRanking.js';

const router = Router();

// GET plan for family for month (defaults to current month)
router.get('/', async (req, res) => {
  try {
    const familyId = req.query.family_id;
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    if (!familyId) {
      return res.status(400).json({ error: 'family_id query parameter is required' });
    }

    // 1. Fetch family details
    const famRes = await db.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) {
      return res.status(404).json({ error: 'Family not found' });
    }
    const family = famRes.rows[0];
    const totalIncome = Number(family.total_monthly_income);

    // 2. Fetch current market snapshot
    const market = await getCurrentMarketSnapshot();

    // 3. Baseline budget split engine
    const split = calculateBudgetSplit(totalIncome, market.trend_direction);

    let planRes = await db.query(
      'SELECT * FROM monthly_plans WHERE family_id = $1 AND month = $2',
      [familyId, month]
    );

    let plan;

    if (planRes.rows.length === 0) {
      // Create new plan
      plan = await withTransaction(async (tx) => {
        const newPlanRes = await tx.query(
          `INSERT INTO monthly_plans
           (family_id, month, spend_budget, save_budget, invest_budget, discretionary_budget, market_trend)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            familyId, month,
            split.amounts.spend_budget,
            split.amounts.save_budget,
            split.amounts.invest_budget,
            split.amounts.discretionary_budget,
            market.trend_direction
          ]
        );
        return newPlanRes.rows[0];
      });
    } else {
      const existing = planRes.rows[0];

      // Check if custom overrides exist
      const customSpend = existing.custom_spend !== null && existing.custom_spend !== undefined ? Number(existing.custom_spend) : null;
      const customInvest = existing.custom_invest !== null && existing.custom_invest !== undefined ? Number(existing.custom_invest) : null;
      const customDiscretionary = existing.custom_discretionary !== null && existing.custom_discretionary !== undefined ? Number(existing.custom_discretionary) : null;

      const spend = customSpend !== null ? customSpend : split.amounts.spend_budget;
      const invest = customInvest !== null ? customInvest : split.amounts.invest_budget;
      const discretionary = customDiscretionary !== null ? customDiscretionary : split.amounts.discretionary_budget;
      const save = Math.max(0, Number((totalIncome - spend - invest - discretionary).toFixed(2)));

      await db.query(
        `UPDATE monthly_plans SET
           spend_budget = $1, save_budget = $2, invest_budget = $3,
           discretionary_budget = $4, market_trend = $5
         WHERE id = $6`,
        [spend, save, invest, discretionary, market.trend_direction, existing.id]
      );

      plan = {
        ...existing,
        spend_budget: spend,
        save_budget: save,
        invest_budget: invest,
        discretionary_budget: discretionary,
        custom_spend: customSpend,
        custom_invest: customInvest,
        custom_discretionary: customDiscretionary,
        market_trend: market.trend_direction
      };
    }

    // 4. Fetch purchases for plan
    const purchasesRes = await db.query(
      'SELECT * FROM purchases WHERE plan_id = $1 ORDER BY priority_weight DESC, id ASC',
      [plan.id]
    );
    const purchases = purchasesRes.rows.map(p => ({
      ...p,
      amount: Number(p.amount)
    }));

    // 5. Run Knapsack optimization
    const knapsackResult = solveKnapsack(purchases, Number(plan.discretionary_budget), Number(plan.spend_budget));

    // Calculate real-time interconnectivity
    const totalShortTermSpent = knapsackResult.totalCost;
    const unusedDiscretionary = Math.max(0, Number(plan.discretionary_budget) - totalShortTermSpent);
    const effectiveSaveBudget = Number((Number(plan.save_budget) + unusedDiscretionary).toFixed(2));

    // 6. Fetch goals and run priority-waterfall allocation using invest_budget
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

    const rankingResult = rankGoalsAndAllocate(
      rawGoals,
      totalIncome,
      Number(plan.invest_budget),
      effectiveSaveBudget,
      market.trend_direction,
      knapsackResult.totalCost
    );

    res.json({
      plan: {
        ...plan,
        spend_budget: Number(plan.spend_budget),
        save_budget: Number(plan.save_budget),
        effective_save_budget: effectiveSaveBudget,
        unused_discretionary: unusedDiscretionary,
        invest_budget: Number(plan.invest_budget),
        discretionary_budget: Number(plan.discretionary_budget)
      },
      family: { ...family, total_monthly_income: totalIncome },
      market,
      splitEngine: {
        ...split,
        amounts: {
          spend_budget: Number(plan.spend_budget),
          save_budget: Number(plan.save_budget),
          effective_save_budget: effectiveSaveBudget,
          invest_budget: Number(plan.invest_budget),
          discretionary_budget: Number(plan.discretionary_budget)
        }
      },
      purchases,
      knapsackResult,
      goalRankingResult: rankingResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/plans/:plan_id/budget — Custom edit Essentials, Investment, or Discretionary budgets
router.put('/:plan_id/budget', async (req, res) => {
  try {
    const planId = req.params.plan_id;
    const { spend_budget, invest_budget, discretionary_budget, reset_defaults } = req.body;

    const planRes = await db.query('SELECT * FROM monthly_plans WHERE id = $1', [planId]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    const plan = planRes.rows[0];

    const famRes = await db.query('SELECT * FROM families WHERE id = $1', [plan.family_id]);
    const family = famRes.rows[0];
    const totalIncome = Number(family.total_monthly_income);

    if (reset_defaults) {
      // Reset to automatic market-aware split
      const market = await getCurrentMarketSnapshot();
      const split = calculateBudgetSplit(totalIncome, market.trend_direction);

      await db.query(
        `UPDATE monthly_plans SET
           spend_budget = $1, save_budget = $2, invest_budget = $3, discretionary_budget = $4,
           custom_spend = NULL, custom_invest = NULL, custom_discretionary = NULL
         WHERE id = $5`,
        [
          split.amounts.spend_budget,
          split.amounts.save_budget,
          split.amounts.invest_budget,
          split.amounts.discretionary_budget,
          planId
        ]
      );
      return res.json({ message: 'Budget reset to automatic market allocation', split });
    }

    const newSpend = spend_budget !== undefined ? Math.max(0, Number(spend_budget)) : Number(plan.spend_budget);
    const newInvest = invest_budget !== undefined ? Math.max(0, Number(invest_budget)) : Number(plan.invest_budget);
    const newDiscretionary = discretionary_budget !== undefined ? Math.max(0, Number(discretionary_budget)) : Number(plan.discretionary_budget);

    // Calculate Cash Savings as the balancing figure: Income - Spend - Invest - Discretionary
    const newSave = Math.max(0, Number((totalIncome - newSpend - newInvest - newDiscretionary).toFixed(2)));

    const result = await db.query(
      `UPDATE monthly_plans SET
         spend_budget = $1, save_budget = $2, invest_budget = $3, discretionary_budget = $4,
         custom_spend = $1, custom_invest = $3, custom_discretionary = $4
       WHERE id = $5 RETURNING *`,
      [newSpend, newSave, newInvest, newDiscretionary, planId]
    );

    res.json({
      message: 'Budget allocation updated successfully. Savings automatically rebalanced.',
      plan: result.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/plans/:plan_id/optimize
router.post('/:plan_id/optimize', async (req, res) => {
  try {
    const planId = req.params.plan_id;

    const planRes = await db.query('SELECT * FROM monthly_plans WHERE id = $1', [planId]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    const plan = planRes.rows[0];
    const capacity = Number(plan.discretionary_budget);

    const purchasesRes = await db.query('SELECT * FROM purchases WHERE plan_id = $1', [planId]);
    const purchases = purchasesRes.rows.map(p => ({
      ...p,
      amount: Number(p.amount),
      priority_weight: Number(p.priority_weight)
    }));

    const knapsack = solveKnapsack(purchases, capacity, Number(plan.spend_budget));

    await withTransaction(async (tx) => {
      for (const item of purchases) {
        const exp = knapsack.explanations[item.id];
        const status = exp?.accepted ? 'ACCEPTED' : 'DEFERRED';
        const reason = exp?.reason || 'Evaluated by 0/1 Knapsack DP';

        await tx.query(
          `UPDATE purchases SET status = $1, decision_reason = $2 WHERE id = $3`,
          [status, reason, item.id]
        );
      }
    });

    res.json({
      message: '0/1 Knapsack optimization applied.',
      knapsackResult: knapsack
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
