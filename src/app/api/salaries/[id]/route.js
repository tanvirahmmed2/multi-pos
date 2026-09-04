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
    const result = await query('SELECT * FROM salaries WHERE salary_id = $1', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Salary structure not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching salary structure:', error);
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
    const { title, base_salary, bonus = 0, allowance = 0, deduction = 0, note = '' } = body;

    const baseVal = parseFloat(base_salary) || 0;
    const bonusVal = parseFloat(bonus) || 0;
    const allowanceVal = parseFloat(allowance) || 0;
    const deductionVal = parseFloat(deduction) || 0;
    const netVal = baseVal + bonusVal + allowanceVal - deductionVal;

    const result = await query(
      `UPDATE salaries 
       SET title = $1, base_salary = $2, bonus = $3, allowance = $4, deduction = $5, net_salary = $6, note = $7
       WHERE salary_id = $8
       RETURNING *`,
      [title.trim(), baseVal, bonusVal, allowanceVal, deductionVal, netVal, note ? note.trim() : '', id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Salary structure not found' }, { status: 404 });
    }

    const salary = result.rows[0];

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'UPDATE_SALARY_STRUCTURE',
      entity: 'salaries',
      entityId: salary.salary_id,
      details: `Updated salary structure ${salary.title}`
    });

    return Response.json(salary, { status: 200 });
  } catch (error) {
    console.error('Error updating salary structure:', error);
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
    const result = await query('DELETE FROM salaries WHERE salary_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Salary structure not found' }, { status: 404 });
    }

    const deleted = result.rows[0];

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'DELETE_SALARY_STRUCTURE',
      entity: 'salaries',
      entityId: id,
      details: `Deleted salary structure ${deleted.title}`
    });

    return Response.json({ message: 'Salary structure deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting salary structure:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
