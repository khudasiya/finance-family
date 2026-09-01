import { PGlite } from '@electric-sql/pglite';
import path from 'path';

import fs from 'fs';

// Singleton PGlite instance
export const pg = new PGlite();

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  exec(sql: string): Promise<void>;
}

export const db: DbClient = {
  async query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    const res = await pg.query<T>(sql, params);
    return {
      rows: res.rows || [],
      rowCount: res.rows ? res.rows.length : 0
    };
  },
  async exec(sql: string): Promise<void> {
    await pg.exec(sql);
  }
};

/**
 * Execute operations within an explicit PostgreSQL ACID transaction.
 * Automatically rolls back on error.
 */
export async function withTransaction<T>(callback: (tx: DbClient) => Promise<T>): Promise<T> {
  await pg.exec('BEGIN TRANSACTION;');
  try {
    const result = await callback(db);
    await pg.exec('COMMIT;');
    return result;
  } catch (error) {
    await pg.exec('ROLLBACK;');
    throw error;
  }
}
