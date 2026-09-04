import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { checkShareInvestmentEnabled } from '@/lib/financial';
import { recalculateShares } from '@/lib/shares';

export async function GET(req) {
  try {
    const isEnabled = await checkShareInvestmentEnabled();
    if (!isEnabled) {
      return Response.json({ error: 'Share Investment Mode is disabled', disabled: true }, { status: 403 });
    }

    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message || 'Access denied: Admin role required' }, { status: 403 });
    }

    // Refresh shares calculation before returning
    await recalculateShares();

    const result = await query(`
      SELECT 
        s.*,
        i.name AS investor_name,
        i.phone AS investor_phone,
        i.email AS investor_email,
        COALESCE(inv_totals.total_investment, 0) AS total_investment
      FROM shares s
      LEFT JOIN investors i ON s.investor_id = i.investor_id
      LEFT JOIN (
        SELECT investor_id, SUM(amount) AS total_investment
        FROM investments
        WHERE investor_id IS NOT NULL
        GROUP BY investor_id
      ) inv_totals ON s.investor_id = inv_totals.investor_id
      ORDER BY s.share_percentage DESC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching shares:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const isEnabled = await checkShareInvestmentEnabled();
    if (!isEnabled) {
      return Response.json({ error: 'Share Investment Mode is disabled', disabled: true }, { status: 403 });
    }

    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message || 'Access denied: Admin role required' }, { status: 403 });
    }

    // Recalculate shares automatically based on investments
    const res = await recalculateShares();
    return Response.json({
      message: 'Shares are computed automatically based on investor investments.',
      recalculated: res
    }, { status: 200 });
  } catch (error) {
    console.error('Error recalculating shares:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
