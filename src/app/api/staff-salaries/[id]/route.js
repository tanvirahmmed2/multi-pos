import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const result = await query(`
      SELECT 
        ss.*,
        s.name AS staff_name,
        s.email AS staff_email,
        s.role AS staff_role,
        sal.title AS salary_title,
        sal.base_salary,
        sal.bonus,
        sal.allowance,
        sal.deduction,
        sal.net_salary
      FROM staff_salaries ss
      LEFT JOIN staffs s ON ss.staff_id = s.staff_id
      LEFT JOIN salaries sal ON ss.salary_id = sal.salary_id
      WHERE ss.staff_salary_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Staff salary assignment not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching staff salary assignment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { salary_id, staff_id, effective_date, status = 'active', note = '' } = body;

    const result = await query(
      `UPDATE staff_salaries
       SET salary_id = $1, staff_id = $2, effective_date = $3, status = $4, note = $5
       WHERE staff_salary_id = $6
       RETURNING *`,
      [parseInt(salary_id, 10), parseInt(staff_id, 10), effective_date, status, note ? note.trim() : '', id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Staff salary assignment not found' }, { status: 404 });
    }

    const assignment = result.rows[0];

    // Synchronize pending payment record for this staff_salary_id
    try {
      const salResult = await query(`SELECT net_salary FROM salaries WHERE salary_id = $1`, [parseInt(salary_id, 10)]);
      const netSalary = salResult.rows.length > 0 ? parseFloat(salResult.rows[0].net_salary) || 0 : 0;

      const dateObj = new Date(effective_date);
      const paymentMonth = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' })
        : new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

      const checkPending = await query(
        `SELECT payment_id FROM salary_payments WHERE staff_salary_id = $1 AND status = 'pending'`,
        [id]
      );

      if (checkPending.rows.length > 0) {
        await query(
          `UPDATE salary_payments
           SET staff_id = $1, amount = $2, payment_month = $3, payment_date = $4
           WHERE staff_salary_id = $5 AND status = 'pending'`,
          [parseInt(staff_id, 10), netSalary, paymentMonth, effective_date, id]
        );
      } else {
        await query(
          `INSERT INTO salary_payments (staff_salary_id, staff_id, amount, payment_month, payment_method, account_details, transaction_id, status, payment_date, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            parseInt(staff_id, 10),
            netSalary,
            paymentMonth,
            'bank_transfer',
            '',
            '',
            'pending',
            effective_date,
            'Auto-generated pending salary payment'
          ]
        );
      }
    } catch (payErr) {
      console.error('Failed to sync pending salary payment:', payErr);
    }

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'UPDATE_STAFF_SALARY',
      entity: 'staff_salaries',
      entityId: assignment.staff_salary_id,
      details: `Updated staff salary assignment #${id}`
    });

    return Response.json(assignment, { status: 200 });
  } catch (error) {
    console.error('Error updating staff salary assignment:', error);
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

    // Delete associated pending payments first
    try {
      await query(`DELETE FROM salary_payments WHERE staff_salary_id = $1 AND status = 'pending'`, [id]);
    } catch (payErr) {
      console.error('Failed to delete pending salary payments:', payErr);
    }

    const result = await query('DELETE FROM staff_salaries WHERE staff_salary_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Staff salary assignment not found' }, { status: 404 });
    }

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'DELETE_STAFF_SALARY',
      entity: 'staff_salaries',
      entityId: id,
      details: `Deleted staff salary assignment #${id}`
    });

    return Response.json({ message: 'Staff salary assignment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting staff salary assignment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
