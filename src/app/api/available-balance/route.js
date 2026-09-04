import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { getAvailableBalance, checkShareInvestmentEnabled } from '@/lib/financial';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const isEnabled = await checkShareInvestmentEnabled();
    const balance = await getAvailableBalance();

    const [invRes, expRes, purRes, wdrRes] = await Promise.all([
      query('SELECT COALESCE(SUM(amount), 0) AS total FROM investments'),
      query('SELECT COALESCE(SUM(paid_amount), 0) AS total FROM expenses'),
      query('SELECT COALESCE(SUM(total_amount), 0) AS total FROM purchases'),
      query('SELECT COALESCE(SUM(amount), 0) AS total FROM withdrawals')
    ]);

    return Response.json({
      is_share_investment: isEnabled,
      available_balance: balance,
      total_investments: parseFloat(invRes.rows[0]?.total || 0),
      total_expenses: parseFloat(expRes.rows[0]?.total || 0),
      total_purchases: parseFloat(purRes.rows[0]?.total || 0),
      total_withdrawals: parseFloat(wdrRes.rows[0]?.total || 0)
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching available balance:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
