import { Router } from 'express';
import { db } from '../db/client.js';

const router = Router();

// GET purchases for a plan
router.get('/', async (req, res) => {
  try {
    const planId = req.query.plan_id;
    if (!planId) {
      return res.status(400).json({ error: 'plan_id query parameter is required' });
    }

    const result = await db.query(
      'SELECT * FROM purchases WHERE plan_id = $1 ORDER BY priority_weight DESC, id ASC',
      [planId]
    );
    res.json(result.rows.map(r => ({ ...r, amount: Number(r.amount) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new purchase request
router.post('/', async (req, res) => {
  try {
    const { plan_id, item_name, amount, category, priority_weight, budget_type } = req.body;

    if (!plan_id || !item_name || !amount || amount <= 0 || !priority_weight) {
      return res.status(400).json({ error: 'Item name, positive amount, plan_id, and priority weight (1-10) are required' });
    }

    const type = budget_type === 'ESSENTIAL' ? 'ESSENTIAL' : 'DISCRETIONARY';

    const result = await db.query(
      `INSERT INTO purchases (plan_id, item_name, amount, category, priority_weight, budget_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *`,
      [plan_id, item_name, Number(amount), category || 'General', Number(priority_weight), type]
    );

    res.status(201).json({ ...result.rows[0], amount: Number(result.rows[0].amount) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE purchase
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM purchases WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase item not found' });
    }
    res.json({ message: 'Purchase deleted', deleted: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
