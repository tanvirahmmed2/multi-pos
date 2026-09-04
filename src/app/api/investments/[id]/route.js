import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { recalculateShares } from '@/lib/shares';

export async function PUT(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { investor_id, investor_name, amount, payment_method, reference_no, investment_date, note } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: 'Valid investment amount is required' }, { status: 400 });
    }

    let name = investor_name;
    if (investor_id) {
      const invRes = await query('SELECT name FROM investors WHERE investor_id = $1', [investor_id]);
      if (invRes.rows.length > 0) {
        name = invRes.rows[0].name;
      }
    }

    const result = await query(
      `UPDATE investments 
       SET investor_id = $1, investor_name = $2, amount = $3, payment_method = $4, reference_no = $5, investment_date = $6, note = $7, updated_at = NOW()
       WHERE investment_id = $8
       RETURNING *`,
      [
        investor_id ? parseInt(investor_id, 10) : null,
        name || 'Unknown',
        parsedAmount,
        payment_method || 'bank_transfer',
        reference_no || null,
        investment_date || new Date(),
        note || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Investment not found' }, { status: 404 });
    }

    const updated = result.rows[0];

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'UPDATE_INVESTMENT',
      entity: 'investments',
      entityId: id,
      details: `Updated investment record ID ${id}`
    });

    await recalculateShares();

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating investment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const result = await query('DELETE FROM investments WHERE investment_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Investment record not found' }, { status: 404 });
    }

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'DELETE_INVESTMENT',
      entity: 'investments',
      entityId: id,
      details: `Deleted investment record ID ${id}`
    });

    await recalculateShares();

    return Response.json({ message: 'Investment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting investment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
