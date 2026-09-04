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
        pm.payment_id,
        pm.purchase_id,
        pm.payment_method,
        pm.amount_paid,
        pm.transaction_id,
        pm.payment_date,
        p.invoice_no,
        p.supplier_name,
        p.supplier_phone,
        p.total_amount,
        b.name AS branch_name,
        b.code AS branch_code,
        s.name AS staff_name
      FROM purchase_payments pm
      JOIN purchases p ON pm.purchase_id = p.purchase_id
      LEFT JOIN branches b ON p.branch_id = b.branch_id
      LEFT JOIN staffs s ON p.staff_id = s.staff_id
      ORDER BY pm.payment_id DESC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchase payments:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
