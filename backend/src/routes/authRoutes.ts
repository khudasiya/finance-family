import { Router } from 'express';
import { db } from '../db/client.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query(
      'SELECT * FROM families WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const family = result.rows[0];

    // Check password
    if (family.password && family.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return sanitized family object
    const { password: _, ...sanitizedFamily } = family;
    res.json({
      message: 'Login successful',
      family: {
        ...sanitizedFamily,
        total_monthly_income: Number(sanitizedFamily.total_monthly_income)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, total_monthly_income } = req.body;

    if (!name || !email || !password || total_monthly_income === undefined || total_monthly_income < 0) {
      return res.status(400).json({ error: 'Name, email, password, and valid income are required' });
    }

    // Check if email exists
    const existing = await db.query(
      'SELECT id FROM families WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const result = await db.query(
      `INSERT INTO families (name, email, password, total_monthly_income)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), email.trim().toLowerCase(), password, Number(total_monthly_income)]
    );

    const newFamily = result.rows[0];
    const { password: _, ...sanitized } = newFamily;

    res.status(201).json({
      message: 'Household registered successfully',
      family: {
        ...sanitized,
        total_monthly_income: Number(sanitized.total_monthly_income)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me?id=X
router.get('/me', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const result = await db.query('SELECT * FROM families WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Family not found' });
    }

    const { password: _, ...sanitized } = result.rows[0];
    res.json({
      family: {
        ...sanitized,
        total_monthly_income: Number(sanitized.total_monthly_income)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
