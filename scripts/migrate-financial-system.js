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

    console.log('Creating "available_balance" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS available_balance (
        balance_id SERIAL PRIMARY KEY,
        available_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log('Creating "profits" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS profits (
        profit_id SERIAL PRIMARY KEY,
        investor_id INT REFERENCES investors(investor_id) ON DELETE CASCADE,
        profit_date DATE DEFAULT CURRENT_DATE,
        amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        note TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log('Creating "expenses" tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        expense_id SERIAL PRIMARY KEY,
        branch_id INT REFERENCES branches(branch_id) ON DELETE SET NULL,
        staff_id INT REFERENCES staffs(staff_id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        expense_date DATE DEFAULT CURRENT_DATE,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        paid_amount NUMERIC(12,2) DEFAULT 0.00,
        due_amount NUMERIC(12,2) DEFAULT 0.00,
        payment_method VARCHAR(50) DEFAULT 'cash',
        status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'partial', 'cancelled')),
        note TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expense_items (
        expense_item_id SERIAL PRIMARY KEY,
        expense_id INT REFERENCES expenses(expense_id) ON DELETE CASCADE,
        item_name VARCHAR(200) NOT NULL,
        quantity INT DEFAULT 1,
        unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expense_payments (
        payment_id SERIAL PRIMARY KEY,
        expense_id INT REFERENCES expenses(expense_id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        payment_method VARCHAR(50) DEFAULT 'cash',
        transaction_id VARCHAR(100),
        payment_date TIMESTAMP DEFAULT now(),
        note TEXT,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log('Updating "withdrawals" table with withdrawal_type column...');
    await client.query(`
      ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS withdrawal_type VARCHAR(30) DEFAULT 'investment';
    `);

    console.log('Initializing available_balance seed if empty...');
    const balanceCheck = await client.query('SELECT * FROM available_balance LIMIT 1');
    if (balanceCheck.rows.length === 0) {
      const investmentSumRes = await client.query('SELECT COALESCE(SUM(amount), 0) AS total FROM investments');
      const purchaseSumRes = await client.query('SELECT COALESCE(SUM(total_amount), 0) AS total FROM purchases');
      const withdrawalSumRes = await client.query('SELECT COALESCE(SUM(amount), 0) AS total FROM withdrawals');
      
      const totalInv = parseFloat(investmentSumRes.rows[0].total || 0);
      const totalPur = parseFloat(purchaseSumRes.rows[0].total || 0);
      const totalWdr = parseFloat(withdrawalSumRes.rows[0].total || 0);

      const initialBal = Math.max(0, totalInv - totalPur - totalWdr);
      await client.query('INSERT INTO available_balance (available_balance) VALUES ($1)', [initialBal]);
      console.log('Seeded available_balance with:', initialBal);
    }

    await client.query('COMMIT');
    console.log('✅ Successfully migrated financial tables into PostgreSQL!');
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
