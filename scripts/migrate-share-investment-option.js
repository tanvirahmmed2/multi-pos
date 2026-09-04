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
  console.log('Connecting to database:', poolConfig.host, poolConfig.database);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Ensuring "websites" table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS websites (
        website_id SERIAL PRIMARY KEY,
        logo TEXT,
        logo_id TEXT,
        hero_title TEXT,
        hero_subtitle TEXT,
        address TEXT,
        sociallink TEXT,
        email TEXT,
        phone TEXT,
        is_share_investment BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log('Adding "is_share_investment" column if not exists...');
    await client.query('ALTER TABLE websites ADD COLUMN IF NOT EXISTS is_share_investment BOOLEAN DEFAULT FALSE;');

    await client.query('COMMIT');
    console.log('✅ Successfully updated websites table with is_share_investment column!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
