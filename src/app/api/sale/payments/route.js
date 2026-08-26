import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await authenticateUser();
    if (!auth.success || !auth.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = auth.user;
    const isStaff = ['admin', 'manager', 'sales'].includes(user.role);

    let sql = `
      SELECT py.*, o.phone AS order_phone, o.customer_id, c.name AS customer_name,
             (SELECT p.name FROM order_items oi 
              JOIN products p ON oi.product_id = p.product_id 
              WHERE oi.order_id = o.order_id LIMIT 1) AS sample_product_name
      FROM public.payments py
      JOIN public.orders o ON py.order_id = o.order_id
      LEFT JOIN customers c ON o.customer_id = c.customer_id
    `;
    let params = [];

    if (!isStaff) {
      const userPhone = user.phone;
      if (!userPhone) {
        return Response.json([], { status: 200 });
      }
      sql += ' WHERE o.phone = $1';
      params.push(userPhone);
    }

    sql += ' ORDER BY py.payment_id DESC';

    const result = await query(sql, params);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
