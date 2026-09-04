import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { getAvailableBalance, checkShareInvestmentEnabled, updateAvailableBalance } from '@/lib/financial';

export async function GET(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const isEnabled = await checkShareInvestmentEnabled();
    const balance = await getAvailableBalance();

    const [manualRes, salesRes, purRes, expRes, wdrRes, salRes, txRes] = await Promise.all([
      query('SELECT COALESCE(SUM(amount), 0)::float AS total FROM balance_transactions'),
      query("SELECT COALESCE(SUM(amount), 0)::float AS total FROM payments WHERE payment_status = 'completed'"),
      query('SELECT COALESCE(SUM(amount_paid), 0)::float AS total FROM purchase_payments'),
      query('SELECT COALESCE(SUM(paid_amount), 0)::float AS total FROM expenses'),
      query('SELECT COALESCE(SUM(amount), 0)::float AS total FROM withdrawals'),
      query("SELECT COALESCE(SUM(amount), 0)::float AS total FROM salary_payments WHERE status = 'completed'"),
      query(`
        SELECT bt.*, s.name AS staff_name
        FROM balance_transactions bt
        LEFT JOIN staffs s ON bt.staff_id = s.staff_id
        ORDER BY bt.transaction_id DESC
        LIMIT 50
      `)
    ]);

    return Response.json({
      is_share_investment: isEnabled,
      available_balance: balance,
      total_manual_added: manualRes.rows[0]?.total || 0,
      total_sales_payments: salesRes.rows[0]?.total || 0,
      total_purchases: purRes.rows[0]?.total || 0,
      total_expenses: expRes.rows[0]?.total || 0,
      total_withdrawals: wdrRes.rows[0]?.total || 0,
      total_salaries: salRes.rows[0]?.total || 0,
      balance_transactions: txRes.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching balance data:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const isEnabled = await checkShareInvestmentEnabled();
    if (isEnabled) {
      return Response.json({ 
        error: 'Manual balance addition is disabled when Share Investment mode is enabled', 
        disabled: true 
      }, { status: 403 });
    }

    const body = await req.json();
    const { amount, payment_method = 'cash', reference_no = '', note = '' } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: 'Valid positive amount is required to add balance' }, { status: 400 });
    }

    const staffId = auth.staff.staff_id;

    const result = await query(
      `INSERT INTO balance_transactions (staff_id, type, amount, payment_method, reference_no, note)
       VALUES ($1, 'deposit', $2, $3, $4, $5)
       RETURNING *`,
      [
        staffId,
        parsedAmount,
        (payment_method || 'cash').trim(),
        (reference_no || '').trim() || null,
        (note || '').trim() || null
      ]
    );

    const transaction = result.rows[0];

    // Atomically update available balance
    await updateAvailableBalance(parsedAmount);

    await logActivity({
      req,
      staffId,
      action: 'ADD_BALANCE',
      entity: 'balance_transactions',
      entityId: transaction.transaction_id,
      details: `Added manual balance of ৳${parsedAmount} via ${payment_method}`
    });

    return Response.json(transaction, { status: 201 });

  } catch (error) {
    console.error('Error adding balance:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
