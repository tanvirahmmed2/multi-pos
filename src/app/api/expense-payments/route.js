import { query } from '@/lib/db';
import { isManagerOrAdmin } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isManagerOrAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query(`
      SELECT 
        ep.payment_id,
        ep.expense_id,
        ep.amount,
        ep.payment_method,
        ep.note,
        ep.payment_date,
        e.title AS expense_title,
        e.category AS expense_category,
        e.total_amount,
        b.name AS branch_name,
        b.code AS branch_code,
        s.name AS staff_name
      FROM expense_payments ep
      JOIN expenses e ON ep.expense_id = e.expense_id
      LEFT JOIN branches b ON e.branch_id = b.branch_id
      LEFT JOIN staffs s ON e.staff_id = s.staff_id
      ORDER BY ep.payment_id DESC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching expense payments:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
