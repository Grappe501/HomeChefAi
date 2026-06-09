#!/usr/bin/env node
/**
 * Sync required env vars to Netlify production + update .env.local
 * Run: node scripts/sync-netlify-env.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');

const keysJson = execSync(
  'npx supabase projects api-keys --project-ref xqvtnzfnjjsqgtcpkxbz -o json',
  { cwd: root, encoding: 'utf8' },
);
const keys = JSON.parse(keysJson);
const serviceKey = keys.find((k) => k.name === 'service_role')?.api_key;
if (!serviceKey) {
  console.error('Could not fetch Supabase service_role key');
  process.exit(1);
}

const envMap = new Map();
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const i = line.indexOf('=');
    if (i > 0) envMap.set(line.slice(0, i), line.slice(i + 1));
  }
}

envMap.set('SUPABASE_SERVICE_ROLE_KEY', serviceKey);
envMap.set('VITE_API_BASE', envMap.get('VITE_API_BASE') || '/.netlify/functions');
envMap.set('VITE_APP_NAME', envMap.get('VITE_APP_NAME') || 'HomeChef AI');
envMap.set('VITE_SITE_URL', envMap.get('VITE_SITE_URL') || 'https://home-chef-ai.netlify.app');
envMap.set('VITE_ENABLE_BILLING', envMap.get('VITE_ENABLE_BILLING') || 'false');
envMap.delete('KNOWLEDGE_ROOT');

fs.writeFileSync(envPath, [...envMap.entries()].map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
console.log('Updated .env.local');

const netlifyVars = {
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  VITE_API_BASE: '/.netlify/functions',
  VITE_APP_NAME: 'HomeChef AI',
  VITE_SITE_URL: 'https://home-chef-ai.netlify.app',
  VITE_ENABLE_BILLING: 'false',
};

for (const [key, value] of Object.entries(netlifyVars)) {
  execSync(`netlify env:set ${key} "${value.replace(/"/g, '\\"')}"`, {
    cwd: root,
    stdio: 'inherit',
  });
  console.log(`Set Netlify env: ${key}`);
}

console.log('Done — trigger a production deploy so Vite picks up VITE_* vars.');
