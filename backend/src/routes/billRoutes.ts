import { Router } from 'express';
import { db } from '../db/client.js';

const router = Router();

// GET recurring bills for family
router.get('/', async (req, res) => {
  try {
    const familyId = req.query.family_id;
    if (!familyId) {
      return res.status(400).json({ error: 'family_id query parameter is required' });
    }

    const result = await db.query(
      'SELECT * FROM bills WHERE family_id = $1 ORDER BY due_day ASC, id ASC',
      [familyId]
    );

    const bills = result.rows.map(b => ({
      ...b,
      amount: Number(b.amount),
      due_day: Number(b.due_day)
    }));

    const totalMonthlyBills = bills.reduce((sum, b) => sum + b.amount, 0);
    const paidCount = bills.filter(b => b.is_paid).length;

    res.json({
      bills,
      totals: {
        totalMonthlyBills,
        totalAnnualCost: totalMonthlyBills * 12,
        paidCount,
        unpaidCount: bills.length - paidCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new bill
router.post('/', async (req, res) => {
  try {
    const { family_id, name, amount, due_day, category } = req.body;

    if (!family_id || !name || amount === undefined || due_day === undefined) {
      return res.status(400).json({ error: 'Name, amount, due day (1-31), and family_id are required' });
    }

    const result = await db.query(
      `INSERT INTO bills (family_id, name, amount, due_day, category, is_paid)
       VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING *`,
      [
        family_id,
        String(name).trim(),
        Number(amount),
        Number(due_day),
        category || 'Utility'
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      amount: Number(result.rows[0].amount),
      due_day: Number(result.rows[0].due_day)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT toggle bill payment status
router.put('/:id/toggle', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE bills SET is_paid = NOT is_paid WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json({
      ...result.rows[0],
      amount: Number(result.rows[0].amount),
      due_day: Number(result.rows[0].due_day)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE bill
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM bills WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json({ message: 'Bill deleted', deleted: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
