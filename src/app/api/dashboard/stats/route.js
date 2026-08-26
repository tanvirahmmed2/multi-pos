import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const [
      staffRes,
      customerRes,
      prodRes,
      stockRes,
      stockValRes,
      orderRes,
      revenueRes,
      pendingRes,
      completedRes,
      catRes,
      brandRes
    ] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM staffs WHERE role IN ('admin', 'manager', 'sales', 'staff')"),
      query("SELECT COUNT(*)::int AS count FROM customers"),
      query("SELECT COUNT(*)::int AS count FROM products"),
      query("SELECT COALESCE(SUM(stock), 0)::int AS count FROM product_variants"),
      query("SELECT COALESCE(SUM(stock * sale_price), 0)::float AS val, COALESCE(SUM(stock * purchase_price), 0)::float AS cost FROM product_variants"),
      query("SELECT COUNT(*)::int AS count FROM orders"),
      query("SELECT COALESCE(SUM(total_amount), 0)::float AS total FROM orders WHERE status != 'cancelled'"),
      query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'"),
      query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'delivered'"),
      query("SELECT COUNT(*)::int AS count FROM categories"),
      query("SELECT COUNT(*)::int AS count FROM brands")
    ]);

    return Response.json({
      staff: staffRes.rows[0].count,
      customers: customerRes.rows[0].count,
      products: prodRes.rows[0].count,
      totalStock: stockRes.rows[0].count,
      stockValue: stockValRes.rows[0].val,
      stockCost: stockValRes.rows[0].cost,
      orders: orderRes.rows[0].count,
      revenue: revenueRes.rows[0].total,
      pendingOrders: pendingRes.rows[0].count,
      completedOrders: completedRes.rows[0].count,
      categories: catRes.rows[0].count,
      brands: brandRes.rows[0].count
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
