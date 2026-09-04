import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { checkShareInvestmentEnabled, allocateDailySalesProfit } from '@/lib/financial';

export async function GET(req) {
  try {
    const isEnabled = await checkShareInvestmentEnabled();
    if (!isEnabled) {
      return Response.json({ error: 'Share Investment Mode is disabled', disabled: true }, { status: 403 });
    }

    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get('investor_id');

    let sql = `
      SELECT 
        p.*,
        i.name AS investor_name,
        i.phone AS investor_phone
      FROM profits p
      LEFT JOIN investors i ON p.investor_id = i.investor_id
    `;
    const params = [];
    if (investorId) {
      sql += ` WHERE p.investor_id = $1`;
      params.push(parseInt(investorId, 10));
    }
    sql += ` ORDER BY p.profit_id DESC`;

    const profitLogs = await query(sql, params);

    // Summary of profits grouped by investor
    const investorSummaryRes = await query(`
      SELECT 
        inv.investor_id,
        inv.name AS investor_name,
        COALESCE(SUM(p.amount), 0) AS total_accumulated_profit,
        COALESCE(sh.share_percentage, 0) AS share_percentage
      FROM investors inv
      LEFT JOIN profits p ON inv.investor_id = p.investor_id
      LEFT JOIN shares sh ON inv.investor_id = sh.investor_id
      GROUP BY inv.investor_id, inv.name, sh.share_percentage
      ORDER BY inv.investor_id ASC
    `);

    const grandTotalRes = await query(`SELECT COALESCE(SUM(amount), 0) AS total_profit FROM profits`);
    const grandTotalProfit = parseFloat(grandTotalRes.rows[0]?.total_profit || 0);

    return Response.json({
      logs: profitLogs.rows,
      investor_summary: investorSummaryRes.rows,
      grand_total_profit: grandTotalProfit
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching profits:', error);
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
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { profit_amount, note } = body;

    const amount = parseFloat(profit_amount);
    if (isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'Valid profit amount is required for distribution' }, { status: 400 });
    }

    const success = await allocateDailySalesProfit(amount, note || 'Manual profit allocation');
    if (!success) {
      return Response.json({ error: 'Failed to allocate profits to investors' }, { status: 500 });
    }

    return Response.json({ message: 'Profits allocated successfully to all active investors' }, { status: 200 });
  } catch (error) {
    console.error('Error allocating profit:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
