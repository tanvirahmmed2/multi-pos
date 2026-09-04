import fs from 'fs';
import path from 'path';
import pg from 'pg';

const envPath = path.resolve(process.cwd(), '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      envVars[match[1]] = value.trim();
    }
  });
}

const pool = new pg.Pool({
  host: envVars.PG_HOST || process.env.PG_HOST || 'localhost',
  port: parseInt(envVars.PG_PORT || process.env.PG_PORT || '5432', 10),
  user: envVars.PG_USER || process.env.PG_USER || 'postgres',
  password: envVars.PG_PASSWORD || process.env.PG_PASSWORD || '',
  database: envVars.PG_DB || envVars.PG_DATABASE || process.env.PG_DB || process.env.PG_DATABASE || 'pos',
});

async function migrate() {
  try {
    console.log('Running staff_sessions migration...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_sessions (
        session_id SERIAL PRIMARY KEY,
        staff_id INT NOT NULL REFERENCES staffs(staff_id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(50),
        device_info VARCHAR(100),
        last_active TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('staff_sessions database migration completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('staff_sessions migration error:', err);
    await pool.end();
    process.exit(1);
  }
}

migrate();
