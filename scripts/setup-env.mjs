import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');

const url = process.env.SUPABASE_URL || 'https://xqvtnzfnjjsqgtcpkxbz.supabase.co';
const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
if (!existing.includes('=') && existing.startsWith('OPENAI_API_KEY')) {
  existing = `OPENAI_API_KEY=${existing.replace(/^OPENAI_API_KEY/, '')}\n`;
}

const lines = new Map(
  existing.split('\n').filter(Boolean).map((l) => {
    const i = l.indexOf('=');
    return i > 0 ? [l.slice(0, i), l] : [l, l];
  })
);

const set = (k, v) => { if (v) lines.set(k, `${k}=${v}`); };

set('VITE_SUPABASE_URL', url);
set('SUPABASE_URL', url);
if (anon) {
  set('VITE_SUPABASE_ANON_KEY', anon);
  set('SUPABASE_ANON_KEY', anon);
}
lines.set('USE_DEV_STORE', 'USE_DEV_STORE=false');
lines.set('ENABLE_BILLING', 'ENABLE_BILLING=false');

fs.writeFileSync(envPath, [...lines.values()].join('\n') + '\n');
console.log('Updated .env.local with Supabase config (USE_DEV_STORE=false, ENABLE_BILLING=false)');
