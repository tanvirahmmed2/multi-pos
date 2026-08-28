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
