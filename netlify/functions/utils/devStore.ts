import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DevStore } from './types.js';
import { emptyStore } from './types.js';

function resolveDataPaths(): { dataDir: string; storeFile: string } {
  try {
    const metaUrl = typeof import.meta !== 'undefined' ? import.meta.url : undefined;
    if (metaUrl) {
      const dir = path.dirname(fileURLToPath(metaUrl));
      const dataDir = path.resolve(dir, '../../../dev-data');
      return { dataDir, storeFile: path.join(dataDir, 'store.json') };
    }
  } catch {
    // Netlify CJS bundle — import.meta.url unavailable at runtime
  }
  const dataDir = path.join(process.cwd(), 'dev-data');
  return { dataDir, storeFile: path.join(dataDir, 'store.json') };
}

function ensureDir(dataDir: string) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function loadStore(): DevStore {
  const { dataDir, storeFile } = resolveDataPaths();
  ensureDir(dataDir);
  if (!fs.existsSync(storeFile)) {
    const store = emptyStore();
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
    return store;
  }
  return JSON.parse(fs.readFileSync(storeFile, 'utf-8')) as DevStore;
}

export function saveStore(store: DevStore): void {
  const { dataDir, storeFile } = resolveDataPaths();
  ensureDir(dataDir);
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

export function useDevStore(): boolean {
  if (process.env.USE_DEV_STORE === 'true') return true;
  if (process.env.USE_DEV_STORE === 'false') return false;
  const hasSupabase = !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  return !hasSupabase;
}
