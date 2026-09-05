import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { getAvailableBalance } from '@/lib/financial';

export async function GET(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const balance = await getAvailableBalance();

    const [manualRes, salesRes, purRes, expRes, wdrRes, salRes, txRes] = await Promise.all([
      query('SELECT COALESCE(SUM(amount), 0)::float AS total FROM balance_transactions'),
      query("SELECT COALESCE(SUM(amount), 0)::float AS total FROM payments WHERE payment_status = 'completed'"),
      query('SELECT COALESCE(SUM(amount_paid), 0)::float AS total FROM purchase_payments'),
      query('SELECT COALESCE(SUM(paid_amount), 0)::float AS total FROM expenses'),
      query('SELECT COALESCE(SUM(amount), 0)::float AS total FROM withdrawals'),
      query("SELECT COALESCE(SUM(amount), 0)::float AS total FROM salary_payments WHERE status = 'completed'"),
      query(`
        SELECT bt.*, s.name AS staff_name
        FROM balance_transactions bt
        LEFT JOIN staffs s ON bt.staff_id = s.staff_id
        ORDER BY bt.transaction_id DESC
        LIMIT 50
      `)
    ]);

    return Response.json({
      available_balance: balance,
      total_manual_added: manualRes.rows[0]?.total || 0,
      total_sales_payments: salesRes.rows[0]?.total || 0,
      total_purchases: purRes.rows[0]?.total || 0,
      total_expenses: expRes.rows[0]?.total || 0,
      total_withdrawals: wdrRes.rows[0]?.total || 0,
      total_salaries: salRes.rows[0]?.total || 0,
      balance_transactions: txRes.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching balance data:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  return Response.json({ 
    error: 'Manual balance deposit is disabled. Store balance increases automatically through customer sales and investor capital investments.', 
    disabled: true 
  }, { status: 400 });
}
