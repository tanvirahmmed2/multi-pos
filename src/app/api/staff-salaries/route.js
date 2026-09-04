import { query } from '@/lib/db';
import { isManagerOrAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req) {
  try {
    const auth = await isManagerOrAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

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
      ORDER BY ss.staff_salary_id DESC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching staff salaries:', error);
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
    const { salary_id, staff_id, effective_date = null, status = 'active', note = '' } = body;

    if (!salary_id || !staff_id) {
      return Response.json({ error: 'Salary structure ID and Staff ID are required' }, { status: 400 });
    }

    const effDate = effective_date || new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO staff_salaries (salary_id, staff_id, effective_date, status, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parseInt(salary_id, 10), parseInt(staff_id, 10), effDate, status, note ? note.trim() : '']
    );

    const assignment = result.rows[0];

    // Automatically create a pending payment for the staff salary on its effective date
    try {
      const salResult = await query(`SELECT net_salary FROM salaries WHERE salary_id = $1`, [parseInt(salary_id, 10)]);
      const netSalary = salResult.rows.length > 0 ? parseFloat(salResult.rows[0].net_salary) || 0 : 0;

      const dateObj = new Date(effDate);
      const paymentMonth = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' })
        : new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

      await query(
        `INSERT INTO salary_payments (staff_salary_id, staff_id, amount, payment_month, payment_method, account_details, transaction_id, status, payment_date, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          assignment.staff_salary_id,
          parseInt(staff_id, 10),
          netSalary,
          paymentMonth,
          'bank_transfer',
          '',
          '',
          'pending',
          effDate,
          'Auto-generated pending salary payment'
        ]
      );
    } catch (payErr) {
      console.error('Failed to auto-create pending salary payment:', payErr);
    }

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'ASSIGN_STAFF_SALARY',
      entity: 'staff_salaries',
      entityId: assignment.staff_salary_id,
      details: `Assigned salary structure #${salary_id} to staff #${staff_id}`
    });

    return Response.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning staff salary:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
