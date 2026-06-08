import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../db/schema.sql');
const devDataDir = path.resolve(__dirname, '../dev-data');

console.log('HomeChef AI — Database Init');
console.log('Schema file:', schemaPath);

if (!fs.existsSync(devDataDir)) {
  fs.mkdirSync(devDataDir, { recursive: true });
  console.log('Created dev-data directory at', devDataDir);
}

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL is set. Run schema.sql against your Neon/Postgres database:');
  console.log('  psql $DATABASE_URL -f db/schema.sql');
} else {
  console.log('No DATABASE_URL — using local JSON dev store (USE_DEV_STORE=true)');
  console.log('For production on Netlify, add DATABASE_URL from Netlify DB (Neon Postgres).');
}

console.log('Done.');
