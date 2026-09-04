import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { updateAvailableBalance } from '@/lib/financial';

export async function GET(req, { params }) {
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

    const result = await query(
      `SELECT 
        e.*,
        b.name AS branch_name,
        s.name AS staff_name,
        COALESCE(
          (SELECT json_agg(ei.*) FROM expense_items ei WHERE ei.expense_id = e.expense_id),
          '[]'::json
        ) AS items,
        COALESCE(
          (SELECT json_agg(ep.*) FROM expense_payments ep WHERE ep.expense_id = e.expense_id),
          '[]'::json
        ) AS payments
      FROM expenses e
      LEFT JOIN branches b ON e.branch_id = b.branch_id
      LEFT JOIN staffs s ON e.staff_id = s.staff_id
      WHERE e.expense_id = $1`,
      [expenseId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
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
    const { title, category, expense_date, note, total_amount } = body;

    const existing = await query('SELECT * FROM expenses WHERE expense_id = $1', [expenseId]);
    if (existing.rows.length === 0) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }

    const oldExpense = existing.rows[0];
    const newTotal = total_amount !== undefined ? parseFloat(total_amount) : parseFloat(oldExpense.total_amount);
    const paid = parseFloat(oldExpense.paid_amount || 0);
    const due = Math.max(0, newTotal - paid);
    const status = due === 0 ? 'completed' : (paid > 0 ? 'partial' : 'pending');

    const result = await query(
      `UPDATE expenses
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           expense_date = COALESCE($3, expense_date),
           total_amount = $4,
           due_amount = $5,
           status = $6,
           note = COALESCE($7, note),
           updated_at = NOW()
       WHERE expense_id = $8
       RETURNING *`,
      [
        title ? title.trim() : null,
        category ? category.trim() : null,
        expense_date || null,
        newTotal,
        due,
        status,
        note !== undefined ? note : null,
        expenseId
      ]
    );

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'UPDATE_EXPENSE',
      entity: 'expenses',
      entityId: expenseId,
      details: `Updated expense: ${result.rows[0].title}`
    });

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error updating expense:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
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

    const existing = await query('SELECT * FROM expenses WHERE expense_id = $1', [expenseId]);
    if (existing.rows.length === 0) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = existing.rows[0];
    const paidAmount = parseFloat(expense.paid_amount || 0);

    // Delete expense (cascades items & payments)
    await query('DELETE FROM expenses WHERE expense_id = $1', [expenseId]);

    // Refund paid amount back to available balance if it was paid
    if (paidAmount > 0) {
      await updateAvailableBalance(paidAmount);
    }

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'DELETE_EXPENSE',
      entity: 'expenses',
      entityId: expenseId,
      details: `Deleted expense #${expenseId}: ${expense.title} (Refunded ৳${paidAmount} to available balance)`
    });

    return Response.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
