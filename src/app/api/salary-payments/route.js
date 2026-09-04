import { query } from '@/lib/db';
import { isManagerOrAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { updateAvailableBalance } from '@/lib/financial';

export async function GET(req) {
  try {
    const auth = await isManagerOrAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

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
      ORDER BY sp.payment_id DESC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching salary payments:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isManagerOrAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

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
      payment_date = null,
      note = ''
    } = body;

    if (!staff_id || amount === undefined || !payment_month) {
      return Response.json({ error: 'Staff ID, amount, and payment month are required' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount) || 0;
    const payDate = payment_date || new Date().toISOString();

    const result = await query(
      `INSERT INTO salary_payments (staff_salary_id, staff_id, amount, payment_month, payment_method, account_details, transaction_id, status, payment_date, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        payDate,
        note ? note.trim() : ''
      ]
    );

    const payment = result.rows[0];

    // Deduct from available balance if payment status is completed
    if (payment.status === 'completed' && parsedAmount > 0) {
      await updateAvailableBalance(-parsedAmount);
    }

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'CREATE_SALARY_PAYMENT',
      entity: 'salary_payments',
      entityId: payment.payment_id,
      details: `Disbursed salary payment of ${parsedAmount} to staff #${staff_id} for ${payment_month}`
    });

    return Response.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating salary payment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
