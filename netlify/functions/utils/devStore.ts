import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DevStore } from './types.js';
import { emptyStore } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../dev-data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadStore(): DevStore {
  ensureDir();
  if (!fs.existsSync(STORE_FILE)) {
    const store = emptyStore();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
    return store;
  }
  return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as DevStore;
}

export function saveStore(store: DevStore): void {
  ensureDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

export function useDevStore(): boolean {
  return process.env.USE_DEV_STORE === 'true' || !process.env.DATABASE_URL;
}
