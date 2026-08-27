import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const result = await query(
      `SELECT 
        inv.*,
        COALESCE(i.total_investment, 0) AS total_investment,
        COALESCE(w.total_withdrawal, 0) AS total_withdrawal,
        (COALESCE(i.total_investment, 0) - COALESCE(w.total_withdrawal, 0)) AS net_balance
      FROM investors inv
      LEFT JOIN (
        SELECT investor_id, SUM(amount) AS total_investment 
        FROM investments 
        WHERE investor_id = $1
        GROUP BY investor_id
      ) i ON inv.investor_id = i.investor_id
      LEFT JOIN (
        SELECT investor_id, SUM(amount) AS total_withdrawal 
        FROM withdrawals 
        WHERE investor_id = $1
        GROUP BY investor_id
      ) w ON inv.investor_id = w.investor_id
      WHERE inv.investor_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Investor not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching investor:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, phone, email, address, nid_passport, is_active, note } = body;

    if (!name) {
      return Response.json({ error: 'Investor name is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE investors 
       SET name = $1, phone = $2, email = $3, address = $4, nid_passport = $5, is_active = $6, note = $7, updated_at = NOW()
       WHERE investor_id = $8
       RETURNING *`,
      [name, phone || null, email || null, address || null, nid_passport || null, is_active !== false, note || null, id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Investor not found' }, { status: 404 });
    }

    const updated = result.rows[0];
    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'UPDATE_INVESTOR',
      entity: 'investors',
      entityId: id,
      details: `Updated investor: ${updated.name}`
    });

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating investor:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const result = await query('DELETE FROM investors WHERE investor_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Investor not found' }, { status: 404 });
    }

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'DELETE_INVESTOR',
      entity: 'investors',
      entityId: id,
      details: `Deleted investor ID ${id}`
    });

    return Response.json({ message: 'Investor deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting investor:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
