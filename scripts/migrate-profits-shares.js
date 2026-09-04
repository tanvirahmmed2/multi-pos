const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Parse .env file manually if process.env isn't populated
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

async function runMigration() {
  console.log('Connecting to database:', poolConfig.host, poolConfig.database);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating "shares" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS shares (
        share_id SERIAL PRIMARY KEY,
        investor_id INT REFERENCES investors(investor_id) ON DELETE CASCADE,
        share_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
        total_amount NUMERIC(12,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        note TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log('Creating "profits" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS profits (
        profit_id SERIAL PRIMARY KEY,
        branch_id INT REFERENCES branches(branch_id) ON DELETE SET NULL,
        title VARCHAR(150) NOT NULL,
        start_date DATE,
        end_date DATE,
        total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        net_profit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        distributed_amount NUMERIC(12,2) DEFAULT 0.00,
        retained_amount NUMERIC(12,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'calculated' CHECK (status IN ('draft', 'calculated', 'distributed', 'closed')),
        note TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log('Creating indexes for shares and profits...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shares_investor_id ON shares(investor_id);
      CREATE INDEX IF NOT EXISTS idx_profits_branch_id ON profits(branch_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully created shares and profits tables in PostgreSQL database!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
