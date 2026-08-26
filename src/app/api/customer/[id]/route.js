import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const isStaff = ['admin', 'manager', 'sales'].includes(auth.user.role);
    if (!isStaff) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch customer details
    const customerRes = await query(
      `SELECT * FROM customers WHERE customer_id = $1`,
      [id]
    );

    if (customerRes.rows.length === 0) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerRes.rows[0];

    // Fetch customer orders (by customer_id or phone matching)
    const ordersRes = await query(
      `SELECT o.*,
              (SELECT JSON_AGG(JSON_BUILD_OBJECT(
                 'order_item_id', oi.order_item_id,
                 'product_id', oi.product_id,
                 'variant_id', oi.variant_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'product_name', p.name,
                 'product_image', COALESCE(pv.image, (SELECT image FROM product_variants WHERE product_id = p.product_id ORDER BY variant_id ASC LIMIT 1)),
                 'variant_name', pv.variant_name
              )) FROM order_items oi
              JOIN products p ON oi.product_id = p.product_id
              LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
              WHERE oi.order_id = o.order_id) AS items
       FROM orders o
       WHERE o.customer_id = $1 OR (o.phone = $2 AND $2 IS NOT NULL AND $2 != '')
       ORDER BY o.created_at DESC`,
      [id, customer.phone]
    );

    const orders = ordersRes.rows;

    // Calculate customer metrics
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, ord) => sum + parseFloat(ord.total_amount || 0), 0),
      totalDue: orders.reduce((sum, ord) => sum + parseFloat(ord.due_amount || 0), 0),
      deliveredCount: orders.filter(o => o.status === 'delivered').length,
      returnedCount: orders.filter(o => o.status === 'returned').length,
      pendingCount: orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(o.status)).length,
    };

    return Response.json({
      customer,
      stats,
      orders
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching customer profile and orders:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
