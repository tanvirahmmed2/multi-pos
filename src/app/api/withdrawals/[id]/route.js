import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function PUT(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { investor_id, investor_name, amount, payment_method, account_details, status, note } = body;

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

    const result = await query(
      `UPDATE withdrawals 
       SET investor_id = $1, investor_name = $2, amount = $3, payment_method = $4, account_details = $5, status = $6, note = $7, updated_at = NOW()
       WHERE withdrawal_id = $8
       RETURNING *`,
      [
        investor_id ? parseInt(investor_id, 10) : null,
        name || null,
        parsedAmount,
        payment_method || 'cash',
        account_details || null,
        status || 'completed',
        note || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    const updated = result.rows[0];

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'UPDATE_WITHDRAWAL',
      entity: 'withdrawals',
      entityId: id,
      details: `Updated withdrawal record ID ${id}`
    });

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating withdrawal:', error);
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
    const result = await query('DELETE FROM withdrawals WHERE withdrawal_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Withdrawal record not found' }, { status: 404 });
    }

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'DELETE_WITHDRAWAL',
      entity: 'withdrawals',
      entityId: id,
      details: `Deleted withdrawal record ID ${id}`
    });

    return Response.json({ message: 'Withdrawal deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting withdrawal:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
