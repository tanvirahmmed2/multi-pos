import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { recalculateShares } from '@/lib/shares';
import { checkShareInvestmentEnabled } from '@/lib/financial';

export async function GET(req) {
  try {
    const isEnabled = await checkShareInvestmentEnabled();
    if (!isEnabled) {
      return Response.json({ error: 'Share Investment Mode is disabled', disabled: true }, { status: 403 });
    }

    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query(`
      SELECT 
        inv.*,
        COALESCE(i.total_investment, 0) AS total_investment,
        COALESCE(w.total_withdrawal, 0) AS total_withdrawal,
        (COALESCE(i.total_investment, 0) - COALESCE(w.total_withdrawal, 0)) AS net_balance,
        COALESCE(sh.share_percentage, 0.00) AS share_percentage
      FROM investors inv
      LEFT JOIN (
        SELECT investor_id, SUM(amount) AS total_investment 
        FROM investments 
        WHERE investor_id IS NOT NULL
        GROUP BY investor_id
      ) i ON inv.investor_id = i.investor_id
      LEFT JOIN (
        SELECT investor_id, SUM(amount) AS total_withdrawal 
        FROM withdrawals 
        WHERE investor_id IS NOT NULL
        GROUP BY investor_id
      ) w ON inv.investor_id = w.investor_id
      LEFT JOIN shares sh ON inv.investor_id = sh.investor_id
      ORDER BY inv.investor_id DESC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching investors:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const isEnabled = await checkShareInvestmentEnabled();
    if (!isEnabled) {
      return Response.json({ error: 'Share Investment Mode is disabled', disabled: true }, { status: 403 });
    }

    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, email, address, nid_passport, is_active, note } = body;

    if (!name) {
      return Response.json({ error: 'Investor name is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO investors (name, phone, email, address, nid_passport, is_active, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        phone || null,
        email || null,
        address || null,
        nid_passport || null,
        is_active !== false,
        note || null
      ]
    );

    const investor = result.rows[0];

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'CREATE_INVESTOR',
      entity: 'investors',
      entityId: investor.investor_id,
      details: `Created investor: ${investor.name}`
    });

    await recalculateShares();

    return Response.json(investor, { status: 201 });
  } catch (error) {
    console.error('Error creating investor:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
