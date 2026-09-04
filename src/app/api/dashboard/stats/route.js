import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { getAvailableBalance } from '@/lib/financial';

export async function GET(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const [
      currentBalance,
      stockValRes,
      prodRes,
      branchRes,
      staffRes,
      salesRes,
      paymentsRes,
      withdrawalsRes,
      purchasePaymentsRes,
      salaryPaymentsRes,
      expensesRes
    ] = await Promise.all([
      getAvailableBalance(),
      query("SELECT COALESCE(SUM(s.stock * v.sale_price), 0)::float AS val, COALESCE(SUM(s.stock), 0)::int AS count FROM stocks s JOIN product_variants v ON s.variant_id = v.variant_id"),
      query("SELECT COUNT(*)::int AS count FROM products"),
      query("SELECT COUNT(*)::int AS count FROM branches"),
      query("SELECT COUNT(*)::int AS count FROM staffs"),
      query(`
        SELECT o.order_id, o.customer_id, o.phone, o.total_amount, o.status, o.created_at, c.name AS customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        ORDER BY o.order_id DESC
        LIMIT 10
      `),
      query(`
        SELECT pm.payment_id, pm.order_id, pm.payment_method, pm.transaction_id, pm.amount, pm.payment_status, pm.paid_at, o.phone, c.name AS customer_name
        FROM payments pm
        JOIN orders o ON pm.order_id = o.order_id
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        ORDER BY pm.payment_id DESC
        LIMIT 10
      `),
      query(`
        SELECT w.withdrawal_id, w.investor_id, COALESCE(i.name, w.investor_name, 'N/A') AS investor_display_name, w.amount, w.withdrawal_type, w.payment_method, w.status, w.created_at
        FROM withdrawals w
        LEFT JOIN investors i ON w.investor_id = i.investor_id
        ORDER BY w.withdrawal_id DESC
        LIMIT 10
      `),
      query(`
        SELECT pm.payment_id, pm.purchase_id, pm.payment_method, pm.amount_paid, pm.transaction_id, pm.payment_date, p.invoice_no, p.supplier_name
        FROM purchase_payments pm
        JOIN purchases p ON pm.purchase_id = p.purchase_id
        ORDER BY pm.payment_id DESC
        LIMIT 10
      `),
      query(`
        SELECT sp.payment_id, sp.staff_id, sp.amount, sp.payment_month, sp.payment_method, sp.status, sp.payment_date, s.name AS staff_name, s.role AS staff_role
        FROM salary_payments sp
        LEFT JOIN staffs s ON sp.staff_id = s.staff_id
        ORDER BY sp.payment_id DESC
        LIMIT 10
      `),
      query(`
        SELECT e.expense_id, e.title, e.category, e.total_amount, e.paid_amount, e.due_amount, e.payment_method, e.status, e.expense_date, e.created_at, b.name AS branch_name
        FROM expenses e
        LEFT JOIN branches b ON e.branch_id = b.branch_id
        ORDER BY e.expense_id DESC
        LIMIT 10
      `)
    ]);

    return Response.json({
      currentBalance,
      stockBalance: stockValRes.rows[0]?.val || 0,
      stockItems: stockValRes.rows[0]?.count || 0,
      totalItems: prodRes.rows[0]?.count || 0,
      totalBranch: branchRes.rows[0]?.count || 0,
      totalStaff: staffRes.rows[0]?.count || 0,
      latestSales: salesRes.rows,
      latestPayments: paymentsRes.rows,
      latestWithdrawals: withdrawalsRes.rows,
      latestPurchasePayments: purchasePaymentsRes.rows,
      latestSalaryPayments: salaryPaymentsRes.rows,
      latestExpenses: expensesRes.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

