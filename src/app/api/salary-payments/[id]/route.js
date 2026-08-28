import { query } from '@/lib/db';
import { isManagerOrAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req, { params }) {
  try {
    const auth = await isManagerOrAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const result = await query(`
      SELECT 
        sp.*,
        s.name AS staff_name,
        s.email AS staff_email,
        s.role AS staff_role,
        sal.title AS salary_title,
        sal.net_salary AS salary_net_amount
      FROM salary_payments sp
      LEFT JOIN staffs s ON sp.staff_id = s.staff_id
      LEFT JOIN staff_salaries ss ON sp.staff_salary_id = ss.staff_salary_id
      LEFT JOIN salaries sal ON ss.salary_id = sal.salary_id
      WHERE sp.payment_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Salary payment not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching salary payment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await isManagerOrAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      staff_salary_id = null,
      staff_id,
      amount,
      payment_month,
      payment_method = 'bank_transfer',
      account_details = '',
      transaction_id = '',
      status = 'completed',
      payment_date,
      note = ''
    } = body;

    const parsedAmount = parseFloat(amount) || 0;

    const result = await query(
      `UPDATE salary_payments
       SET staff_salary_id = $1, staff_id = $2, amount = $3, payment_month = $4, payment_method = $5,
           account_details = $6, transaction_id = $7, status = $8, payment_date = $9, note = $10
       WHERE payment_id = $11
       RETURNING *`,
      [
        staff_salary_id ? parseInt(staff_salary_id, 10) : null,
        parseInt(staff_id, 10),
        parsedAmount,
        payment_month.trim(),
        payment_method.trim(),
        account_details ? account_details.trim() : '',
        transaction_id ? transaction_id.trim() : '',
        status.trim(),
        payment_date,
        note ? note.trim() : '',
        id
      ]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Salary payment not found' }, { status: 404 });
    }

    const payment = result.rows[0];

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'UPDATE_SALARY_PAYMENT',
      entity: 'salary_payments',
      entityId: payment.payment_id,
      details: `Updated salary payment #${id}`
    });

    return Response.json(payment, { status: 200 });
  } catch (error) {
    console.error('Error updating salary payment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await isManagerOrAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const result = await query('DELETE FROM salary_payments WHERE payment_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Salary payment not found' }, { status: 404 });
    }

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'DELETE_SALARY_PAYMENT',
      entity: 'salary_payments',
      entityId: id,
      details: `Deleted salary payment #${id}`
    });

    return Response.json({ message: 'Salary payment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting salary payment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
