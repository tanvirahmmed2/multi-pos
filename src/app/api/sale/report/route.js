import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    // 1. Top Selling Products (Limit to top 8)
    const topProductsRes = await query(`
      SELECT p.name AS name, 
             SUM(oi.quantity)::int AS quantity, 
             SUM(oi.quantity * oi.price)::float AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'cancelled'
      GROUP BY p.product_id, p.name
      ORDER BY quantity DESC
      LIMIT 8
    `);

    // 2. Sales by Category
    const categorySalesRes = await query(`
      SELECT c.name AS name, 
             SUM(oi.quantity)::int AS quantity, 
             SUM(oi.quantity * oi.price)::float AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN categories c ON p.category_id = c.category_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'cancelled'
      GROUP BY c.category_id, c.name
      ORDER BY revenue DESC
    `);

    // 3. Sales History Trends (Last 30 days)
    const salesTrendRes = await query(`
      SELECT DATE(created_at) AS date, 
             COUNT(*)::int AS count, 
             SUM(total_amount)::float AS total
      FROM orders
      WHERE status != 'cancelled' 
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 4. Payment Types Breakdown
    const paymentBreakdownRes = await query(`
      SELECT payment_type AS type, 
             COUNT(*)::int AS count, 
             SUM(total_amount)::float AS total
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY payment_type
    `);

    return Response.json({
      topProducts: topProductsRes.rows,
      categorySales: categorySalesRes.rows,
      salesTrend: salesTrendRes.rows,
      paymentBreakdown: paymentBreakdownRes.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Error compiling analytics report:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
