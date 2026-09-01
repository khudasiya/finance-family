import { Router } from 'express';
import { db } from '../db/client.js';

const router = Router();

// GET assets & net worth summary for family
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
    const totalIncome = Number(family.total_monthly_income);

    const assetsRes = await db.query(
      'SELECT * FROM assets WHERE family_id = $1 ORDER BY value DESC, id ASC',
      [familyId]
    );

    const debtsRes = await db.query(
      'SELECT * FROM debts WHERE family_id = $1',
      [familyId]
    );

    const assets = assetsRes.rows.map(a => ({
      ...a,
      value: Number(a.value)
    }));

    const totalDebts = debtsRes.rows.reduce((sum, d) => sum + Number(d.principal_amount), 0);
    const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
    const liquidAssets = assets.filter(a => a.is_liquid).reduce((sum, a) => sum + a.value, 0);
    const netWorth = totalAssets - totalDebts;

    // Monthly baseline essentials estimate (45% of income)
    const monthlyEssentials = totalIncome * 0.45;
    const emergencyRunwayMonths = monthlyEssentials > 0 ? Number((liquidAssets / monthlyEssentials).toFixed(1)) : 0;

    res.json({
      assets,
      summary: {
        totalAssets,
        liquidAssets,
        totalDebts,
        netWorth,
        emergencyRunwayMonths,
        monthlyEssentials,
        runwayStatus: emergencyRunwayMonths >= 6 ? 'EXCELLENT' : emergencyRunwayMonths >= 3 ? 'GOOD' : 'NEEDS_BUFFER'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new asset
router.post('/', async (req, res) => {
  try {
    const { family_id, name, value, category, is_liquid } = req.body;

    if (!family_id || !name || value === undefined) {
      return res.status(400).json({ error: 'Name, value, and family_id are required' });
    }

    const result = await db.query(
      `INSERT INTO assets (family_id, name, value, category, is_liquid)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        family_id,
        String(name).trim(),
        Number(value),
        category || 'Savings/Cash',
        is_liquid !== undefined ? Boolean(is_liquid) : true
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      value: Number(result.rows[0].value)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE asset
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM assets WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset record not found' });
    }
    res.json({ message: 'Asset deleted', deleted: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
