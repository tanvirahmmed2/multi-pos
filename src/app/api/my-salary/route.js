import { query } from '@/lib/db';
import { authenticateStaff } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const staffId = auth.staff.staff_id;

    // 1. Fetch assigned active/latest salary structure for this staff member
    const structureRes = await query(
      `SELECT 
        ss.staff_salary_id,
        ss.effective_date,
        ss.status AS assignment_status,
        sal.salary_id,
        sal.title AS salary_title,
        sal.base_salary,
        sal.bonus,
        sal.allowance,
        sal.deduction,
        sal.net_salary,
        sal.note AS structure_note
      FROM staff_salaries ss
      JOIN salaries sal ON ss.salary_id = sal.salary_id
      WHERE ss.staff_id = $1
      ORDER BY ss.staff_salary_id DESC
      LIMIT 1`,
      [staffId]
    );

    // 2. Fetch salary payments history for this staff member
    const paymentsRes = await query(
      `SELECT 
        sp.*,
        sal.title AS salary_title
      FROM salary_payments sp
      LEFT JOIN staff_salaries ss ON sp.staff_salary_id = ss.staff_salary_id
      LEFT JOIN salaries sal ON ss.salary_id = sal.salary_id
      WHERE sp.staff_id = $1
      ORDER BY sp.payment_date DESC, sp.payment_id DESC`,
      [staffId]
    );

    return Response.json({
      staff: {
        staff_id: auth.staff.staff_id,
        name: auth.staff.name,
        email: auth.staff.email,
        phone: auth.staff.phone,
        role: auth.staff.role,
        branch_id: auth.staff.branch_id
      },
      salary_structure: structureRes.rows[0] || null,
      payments: paymentsRes.rows
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching personal salary details:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
