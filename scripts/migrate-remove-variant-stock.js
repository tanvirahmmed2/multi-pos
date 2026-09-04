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

    console.log('Fetching branches...');
    const branchesRes = await client.query('SELECT branch_id FROM branches');
    const branchIds = branchesRes.rows.length > 0 ? branchesRes.rows.map(b => b.branch_id) : [1];

    console.log('Seeding existing variants into stocks table if missing...');
    const variantsRes = await client.query('SELECT variant_id FROM product_variants');
    for (const v of variantsRes.rows) {
      for (const bId of branchIds) {
        await client.query(`
          INSERT INTO stocks (variant_id, branch_id, stock)
          VALUES ($1, $2, 0)
          ON CONFLICT (variant_id, branch_id) DO NOTHING
        `, [v.variant_id, bId]);
      }
    }

    console.log('Dropping stock column from product_variants table...');
    await client.query(`
      ALTER TABLE product_variants DROP COLUMN IF EXISTS stock;
    `);

    await client.query('COMMIT');
    console.log('✅ Migration completed: stock column removed from product_variants, stocks table seeded for existing variants!');
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
