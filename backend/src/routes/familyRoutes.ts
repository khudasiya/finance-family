import { Router } from 'express';
import { db } from '../db/client.js';
import { calculateBudgetSplit } from '../services/budgetSplit.js';

const router = Router();

// Get all families
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM families ORDER BY id ASC');
    res.json(result.rows.map(r => ({ ...r, total_monthly_income: Number(r.total_monthly_income) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new family
router.post('/', async (req, res) => {
  try {
    const { name, total_monthly_income } = req.body;
    if (!name || total_monthly_income === undefined || total_monthly_income < 0) {
      return res.status(400).json({ error: 'Valid family name and non-negative income required' });
    }

    const result = await db.query(
      `INSERT INTO families (name, total_monthly_income) VALUES ($1, $2) RETURNING *`,
      [name.trim(), Number(total_monthly_income)]
    );
    const fam = result.rows[0];
    res.status(201).json({ ...fam, total_monthly_income: Number(fam.total_monthly_income) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get family by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM families WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Family not found' });
    }
    const fam = result.rows[0];
    res.json({ ...fam, total_monthly_income: Number(fam.total_monthly_income) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update family income, name & avatar
router.put('/:id', async (req, res) => {
  try {
    const { name, total_monthly_income, avatar_url } = req.body;
    const newIncome = total_monthly_income !== undefined ? Number(total_monthly_income) : undefined;

    const result = await db.query(
      `UPDATE families SET 
         name = COALESCE($1, name), 
         total_monthly_income = COALESCE($2, total_monthly_income),
         avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4 RETURNING *`,
      [name ? name.trim() : null, newIncome, avatar_url !== undefined ? avatar_url : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Family not found' });
    }

    const family = result.rows[0];
    const incomeNum = Number(family.total_monthly_income);

    // Recalculate monthly plans budgets for this family if income changed
    if (newIncome !== undefined) {
      const plansRes = await db.query('SELECT * FROM monthly_plans WHERE family_id = $1', [family.id]);
      for (const p of plansRes.rows) {
        const split = calculateBudgetSplit(incomeNum, p.market_trend || 'NEUTRAL');
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
            p.id
          ]
        );
      }
    }

    res.json({ ...family, total_monthly_income: incomeNum });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
