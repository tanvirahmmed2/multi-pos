import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query('SELECT * FROM salaries ORDER BY salary_id DESC');
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching salaries:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { title, base_salary, bonus = 0, allowance = 0, deduction = 0, note = '' } = body;

    if (!title || base_salary === undefined) {
      return Response.json({ error: 'Title and base salary are required' }, { status: 400 });
    }

    const baseVal = parseFloat(base_salary) || 0;
    const bonusVal = parseFloat(bonus) || 0;
    const allowanceVal = parseFloat(allowance) || 0;
    const deductionVal = parseFloat(deduction) || 0;
    const netVal = baseVal + bonusVal + allowanceVal - deductionVal;

    const result = await query(
      `INSERT INTO salaries (title, base_salary, bonus, allowance, deduction, net_salary, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title.trim(), baseVal, bonusVal, allowanceVal, deductionVal, netVal, note ? note.trim() : '']
    );

    const salary = result.rows[0];

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'CREATE_SALARY_STRUCTURE',
      entity: 'salaries',
      entityId: salary.salary_id,
      details: `Created salary grade ${salary.title} with net salary ${salary.net_salary}`
    });

    return Response.json(salary, { status: 201 });
  } catch (error) {
    console.error('Error creating salary structure:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
