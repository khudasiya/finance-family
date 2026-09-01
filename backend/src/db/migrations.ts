import { db } from './client.js';

export async function runMigrations(): Promise<void> {
  console.log('Running PostgreSQL migrations...');

  const migrationSql = `
    CREATE TABLE IF NOT EXISTS families (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      total_monthly_income NUMERIC(12, 2) NOT NULL CHECK (total_monthly_income >= 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE families ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    ALTER TABLE families ADD COLUMN IF NOT EXISTS password VARCHAR(255);

    CREATE TABLE IF NOT EXISTS monthly_plans (
      id SERIAL PRIMARY KEY,
      family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      month VARCHAR(7) NOT NULL,
      spend_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
      save_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
      invest_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
      discretionary_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
      custom_spend NUMERIC(12, 2),
      custom_invest NUMERIC(12, 2),
      custom_discretionary NUMERIC(12, 2),
      market_trend VARCHAR(20) NOT NULL DEFAULT 'NEUTRAL',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_family_month UNIQUE (family_id, month)
    );

    ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS custom_spend NUMERIC(12, 2);
    ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS custom_invest NUMERIC(12, 2);
    ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS custom_discretionary NUMERIC(12, 2);

    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      plan_id INTEGER NOT NULL REFERENCES monthly_plans(id) ON DELETE CASCADE,
      item_name VARCHAR(255) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      category VARCHAR(100) NOT NULL,
      priority_weight INTEGER NOT NULL CHECK (priority_weight BETWEEN 1 AND 10),
      budget_type VARCHAR(20) NOT NULL DEFAULT 'DISCRETIONARY',
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      decision_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE purchases ADD COLUMN IF NOT EXISTS budget_type VARCHAR(20) DEFAULT 'DISCRETIONARY';

    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      description VARCHAR(255) NOT NULL,
      target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
      horizon_years NUMERIC(4, 1) NOT NULL CHECK (horizon_years > 0),
      user_importance INTEGER NOT NULL CHECK (user_importance BETWEEN 1 AND 10),
      status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
      priority_rank INTEGER,
      calculated_score NUMERIC(8, 4),
      allocated_invest_amount NUMERIC(12, 2) DEFAULT 0,
      custom_allocated_amount NUMERIC(12, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE goals ADD COLUMN IF NOT EXISTS custom_allocated_amount NUMERIC(12, 2);

    CREATE TABLE IF NOT EXISTS market_snapshots (
      id SERIAL PRIMARY KEY,
      date VARCHAR(10) NOT NULL UNIQUE,
      index_value NUMERIC(12, 2) NOT NULL,
      trend_direction VARCHAR(20) NOT NULL CHECK (trend_direction IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
      change_percent NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spending_logs (
      id SERIAL PRIMARY KEY,
      plan_id INTEGER NOT NULL REFERENCES monthly_plans(id) ON DELETE CASCADE,
      period_type VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
      period_name VARCHAR(50) NOT NULL DEFAULT 'Month End',
      essentials_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
      discretionary_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
      savings_added NUMERIC(12, 2) NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS safe_locker (
      id SERIAL PRIMARY KEY,
      family_id INTEGER NOT NULL UNIQUE REFERENCES families(id) ON DELETE CASCADE,
      total_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_audits (
      id SERIAL PRIMARY KEY,
      family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      audit_month VARCHAR(7) NOT NULL,
      planned_essentials NUMERIC(12, 2) NOT NULL DEFAULT 0,
      actual_essentials NUMERIC(12, 2) NOT NULL DEFAULT 0,
      planned_discretionary NUMERIC(12, 2) NOT NULL DEFAULT 0,
      actual_discretionary NUMERIC(12, 2) NOT NULL DEFAULT 0,
      unspent_surplus NUMERIC(12, 2) NOT NULL DEFAULT 0,
      transferred_to_locker NUMERIC(12, 2) NOT NULL DEFAULT 0,
      transferred_to_goals NUMERIC(12, 2) NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE monthly_audits ADD COLUMN IF NOT EXISTS transferred_to_goals NUMERIC(12, 2) DEFAULT 0;
    ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_saved_amount NUMERIC(12, 2) DEFAULT 0;
  `;

  await db.exec(migrationSql);
  console.log('PostgreSQL schema migrations completed successfully.');
}
