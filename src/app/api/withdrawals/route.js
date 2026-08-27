import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get('investor_id');

    let sql = `
      SELECT 
        w.*,
        COALESCE(i.name, w.investor_name) AS investor_display_name,
        i.phone AS investor_phone_contact,
        i.email AS investor_email_contact,
        s.name AS staff_name,
        b.name AS branch_name
      FROM withdrawals w
      LEFT JOIN investors i ON w.investor_id = i.investor_id
      LEFT JOIN staffs s ON w.staff_id = s.staff_id
      LEFT JOIN branches b ON w.branch_id = b.branch_id
    `;

    const params = [];
    if (investorId) {
      sql += ` WHERE w.investor_id = $1`;
      params.push(investorId);
    }

    sql += ` ORDER BY w.withdrawal_id DESC`;

    const result = await query(sql, params);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { investor_id, investor_name, branch_id, amount, payment_method, account_details, status, note } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: 'Valid withdrawal amount is required' }, { status: 400 });
    }

    let name = investor_name;
    if (investor_id) {
      const invRes = await query('SELECT name FROM investors WHERE investor_id = $1', [investor_id]);
      if (invRes.rows.length > 0) {
        name = invRes.rows[0].name;
      }
    }

    const staffId = auth.staff.staff_id;
    const branchVal = branch_id ? parseInt(branch_id, 10) : auth.staff.branch_id;

    const result = await query(
      `INSERT INTO withdrawals (investor_id, branch_id, staff_id, investor_name, amount, payment_method, account_details, status, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        investor_id ? parseInt(investor_id, 10) : null,
        branchVal || null,
        staffId || null,
        name || null,
        parsedAmount,
        payment_method || 'cash',
        account_details || null,
        status || 'completed',
        note || null
      ]
    );

    const withdrawal = result.rows[0];

    await logActivity({
      req,
      staffId,
      action: 'CREATE_WITHDRAWAL',
      entity: 'withdrawals',
      entityId: withdrawal.withdrawal_id,
      details: `Recorded withdrawal of ৳${parsedAmount}${name ? ` for ${name}` : ''}`
    });

    return Response.json(withdrawal, { status: 201 });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
