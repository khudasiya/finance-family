import { db } from './client.js';

export async function seedDatabase(): Promise<void> {
  const existing = await db.query('SELECT COUNT(*) as count FROM families');
  if (parseInt(existing.rows[0]?.count || '0', 10) > 0) {
    await db.query(
      `UPDATE families SET email = COALESCE(email, 'sharma@financefamily.com'), password = COALESCE(password, 'password123') WHERE email IS NULL`
    );
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding initial data (Clean household slate, no pre-added expenses or goals)...');

  // 1. Create family account
  const familyRes = await db.query<{ id: number }>(
    `INSERT INTO families (name, email, password, total_monthly_income) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['Sharma Household', 'sharma@financefamily.com', 'password123', 150000]
  );
  const familyId = familyRes.rows[0].id;

  // 2. Market snapshot
  const today = new Date().toISOString().split('T')[0];
  await db.query(
    `INSERT INTO market_snapshots (date, index_value, trend_direction, change_percent)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (date) DO UPDATE SET index_value = EXCLUDED.index_value, trend_direction = EXCLUDED.trend_direction`,
    [today, 24580.50, 'BULLISH', 1.45]
  );

  // 3. Create monthly plan (current month) with 0 pre-added purchases and 0 pre-added goals
  const currentMonth = new Date().toISOString().slice(0, 7);
  await db.query(
    `INSERT INTO monthly_plans (family_id, month, spend_budget, save_budget, invest_budget, discretionary_budget, market_trend)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [familyId, currentMonth, 67500, 30000, 37500, 15000, 'BULLISH']
  );

  console.log('Database seeded cleanly. Zero pre-added expenses or goals.');
}
