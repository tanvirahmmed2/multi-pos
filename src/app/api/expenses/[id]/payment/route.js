import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { updateAvailableBalance, getAvailableBalance } from '@/lib/financial';

export async function POST(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const expenseId = parseInt(id, 10);
    if (isNaN(expenseId)) {
      return Response.json({ error: 'Invalid expense ID' }, { status: 400 });
    }

    const body = await req.json();
    const { amount, payment_method, note } = body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return Response.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    const currentBal = await getAvailableBalance();
    if (paymentAmount > currentBal) {
      return Response.json({ 
        error: `Insufficient available balance (৳${currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Expense payment (৳${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds available balance.` 
      }, { status: 400 });
    }

    const existing = await query('SELECT * FROM expenses WHERE expense_id = $1', [expenseId]);
    if (existing.rows.length === 0) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = existing.rows[0];
    const totalAmount = parseFloat(expense.total_amount || 0);
    const currentPaid = parseFloat(expense.paid_amount || 0);
    const newPaid = currentPaid + paymentAmount;
    const newDue = Math.max(0, totalAmount - newPaid);
    const newStatus = newDue === 0 ? 'completed' : 'partial';

    // Insert payment record
    const paymentResult = await query(
      `INSERT INTO expense_payments (expense_id, amount, payment_method, note)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [expenseId, paymentAmount, payment_method || 'cash', note || 'Additional payment']
    );

    // Update expense record
    await query(
      `UPDATE expenses
       SET paid_amount = $1, due_amount = $2, status = $3, updated_at = NOW()
       WHERE expense_id = $4`,
      [newPaid, newDue, newStatus, expenseId]
    );

    // Deduct payment from available balance
    await updateAvailableBalance(-paymentAmount);

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'ADD_EXPENSE_PAYMENT',
      entity: 'expenses',
      entityId: expenseId,
      details: `Added ৳${paymentAmount} payment to expense #${expenseId} (${expense.title})`
    });

    return Response.json({
      payment: paymentResult.rows[0],
      paid_amount: newPaid,
      due_amount: newDue,
      status: newStatus
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding expense payment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
