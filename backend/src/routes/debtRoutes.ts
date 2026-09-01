import { Router } from 'express';
import { db } from '../db/client.js';

const router = Router();

// GET debts for family
router.get('/', async (req, res) => {
  try {
    const familyId = req.query.family_id;
    if (!familyId) {
      return res.status(400).json({ error: 'family_id query parameter is required' });
    }

    const famRes = await db.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) {
      return res.status(404).json({ error: 'Family not found' });
    }
    const family = famRes.rows[0];
    const monthlyIncome = Number(family.total_monthly_income);

    const debtsRes = await db.query(
      'SELECT * FROM debts WHERE family_id = $1 ORDER BY interest_rate DESC, principal_amount ASC',
      [familyId]
    );

    const debts = debtsRes.rows.map(d => ({
      ...d,
      principal_amount: Number(d.principal_amount),
      interest_rate: Number(d.interest_rate),
      minimum_payment: Number(d.minimum_payment)
    }));

    const totalPrincipal = debts.reduce((sum, d) => sum + d.principal_amount, 0);
    const totalMinMonthlyPayment = debts.reduce((sum, d) => sum + d.minimum_payment, 0);
    const dtiRatio = monthlyIncome > 0 ? Number(((totalMinMonthlyPayment / monthlyIncome) * 100).toFixed(1)) : 0;

    // Calculate Snowball vs Avalanche payoff stats
    let snowballOrder = [...debts].sort((a, b) => a.principal_amount - b.principal_amount);
    let avalancheOrder = [...debts].sort((a, b) => b.interest_rate - a.interest_rate);

    res.json({
      debts,
      totals: {
        totalPrincipal,
        totalMinMonthlyPayment,
        dtiRatio,
        dtiStatus: dtiRatio <= 20 ? 'HEALTHY' : dtiRatio <= 36 ? 'MODERATE' : 'HIGH_RISK'
      },
      strategies: {
        snowball: snowballOrder,
        avalanche: avalancheOrder
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new debt
router.post('/', async (req, res) => {
  try {
    const { family_id, name, principal_amount, interest_rate, minimum_payment, debt_type } = req.body;

    if (!family_id || !name || principal_amount === undefined || interest_rate === undefined || minimum_payment === undefined) {
      return res.status(400).json({ error: 'Name, principal amount, interest rate, minimum payment, and family_id are required' });
    }

    const result = await db.query(
      `INSERT INTO debts (family_id, name, principal_amount, interest_rate, minimum_payment, debt_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        family_id,
        String(name).trim(),
        Number(principal_amount),
        Number(interest_rate),
        Number(minimum_payment),
        debt_type || 'Personal Loan'
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      principal_amount: Number(result.rows[0].principal_amount),
      interest_rate: Number(result.rows[0].interest_rate),
      minimum_payment: Number(result.rows[0].minimum_payment)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE debt
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM debts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Debt record not found' });
    }
    res.json({ message: 'Debt record deleted', deleted: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
