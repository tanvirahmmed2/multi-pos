const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const poolConfig = {
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB || process.env.PG_DATABASE,
  ssl: process.env.PG_HOST && process.env.PG_HOST !== 'localhost' && process.env.PG_HOST !== '127.0.0.1' ? { rejectUnauthorized: false } : undefined,
};

const pool = new Pool(poolConfig);

async function run() {
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    console.log('Adding excluded_tax and tax_amount to websites table...');
    await client.query(`
      ALTER TABLE websites 
      ADD COLUMN IF NOT EXISTS excluded_tax BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0;
    `);
    console.log('✅ Migration completed: excluded_tax and tax_amount added to websites table!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
