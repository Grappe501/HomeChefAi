import { neon } from '@neondatabase/serverless';
import { useDevStore, loadStore, saveStore } from './devStore.js';

export function getSql() {
  if (useDevStore()) return null;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export async function query<T = Record<string, unknown>>(
  sqlText: string,
  params: unknown[] = []
): Promise<T[]> {
  const sql = getSql();
  if (!sql) {
    throw new Error('DEV_STORE_MODE');
  }
  const result = await sql(sqlText, params);
  return result as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sqlText: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sqlText, params);
  return rows[0] ?? null;
}

export { useDevStore, loadStore, saveStore };
