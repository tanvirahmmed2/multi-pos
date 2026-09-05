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
    console.log('Adding payment_status, is_paid, and stock_added columns to purchases table...');
    await client.query(`
      ALTER TABLE purchases 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'unpaid',
      ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS stock_added BOOLEAN DEFAULT FALSE;
    `);

    console.log('Backfilling payment and stock statuses for existing purchases...');
    // Existing purchases had stock added on creation
    await client.query(`
      UPDATE purchases
      SET stock_added = TRUE
      WHERE stock_added IS FALSE OR stock_added IS NULL;
    `);

    await client.query(`
      UPDATE purchases p
      SET 
        is_paid = (
          COALESCE((SELECT SUM(amount_paid) FROM purchase_payments pm WHERE pm.purchase_id = p.purchase_id), 0) >= (p.total_amount - 0.01)
        ),
        payment_status = CASE
          WHEN COALESCE((SELECT SUM(amount_paid) FROM purchase_payments pm WHERE pm.purchase_id = p.purchase_id), 0) >= (p.total_amount - 0.01) THEN 'paid'
          WHEN COALESCE((SELECT SUM(amount_paid) FROM purchase_payments pm WHERE pm.purchase_id = p.purchase_id), 0) > 0 THEN 'partial'
          ELSE 'unpaid'
        END;
    `);

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
