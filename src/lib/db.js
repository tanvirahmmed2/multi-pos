import { Pool } from 'pg';
import { PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE } from './secret';

const poolConfig = {
  host: PG_HOST,
  port: parseInt(PG_PORT || '5432', 10),
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE,
  ssl: PG_HOST && PG_HOST !== 'localhost' && PG_HOST !== '127.0.0.1' ? { rejectUnauthorized: false } : undefined,
};

const pool = global.pgPool || new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

export const query = (text, params) => pool.query(text, params);
export default pool;
