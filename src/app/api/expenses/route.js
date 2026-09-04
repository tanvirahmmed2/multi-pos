import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { updateAvailableBalance, getAvailableBalance } from '@/lib/financial';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query(`
      SELECT 
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
      ORDER BY e.expense_id DESC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const {
      branch_id,
      title,
      category,
      expense_date,
      total_amount,
      paid_amount,
      payment_method,
      note,
      items
    } = body;

    if (!title || !title.trim()) {
      return Response.json({ error: 'Expense title is required' }, { status: 400 });
    }

    const total = parseFloat(total_amount || 0);
    const paid = parseFloat(paid_amount || 0);
    if (isNaN(total) || total <= 0) {
      return Response.json({ error: 'Valid total expense amount is required' }, { status: 400 });
    }

    if (paid > 0) {
      const currentBal = await getAvailableBalance();
      if (paid > currentBal) {
        return Response.json({ 
          error: `Insufficient available balance (৳${currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Paid expense amount (৳${paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds available balance.` 
        }, { status: 400 });
      }
    }

    const due = Math.max(0, total - paid);
    const status = due === 0 ? 'completed' : (paid > 0 ? 'partial' : 'pending');
    const staffId = auth.staff.staff_id;
    const branchId = branch_id ? parseInt(branch_id, 10) : auth.staff.branch_id;

    const result = await query(
      `INSERT INTO expenses (
        branch_id, staff_id, title, category, expense_date,
        total_amount, paid_amount, due_amount, payment_method, status, note
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        branchId || null,
        staffId || null,
        title.trim(),
        category || 'General',
        expense_date || new Date().toISOString().split('T')[0],
        total,
        paid,
        due,
        payment_method || 'cash',
        status,
        note || null
      ]
    );

    const expense = result.rows[0];

    // Insert line items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (item.item_name && item.item_name.trim()) {
          const qty = parseInt(item.quantity || 1, 10);
          const unitCost = parseFloat(item.unit_cost || 0);
          const totalCost = qty * unitCost;
          await query(
            `INSERT INTO expense_items (expense_id, item_name, quantity, unit_cost, total_cost)
             VALUES ($1, $2, $3, $4, $5)`,
            [expense.expense_id, item.item_name.trim(), qty, unitCost, totalCost]
          );
        }
      }
    }

    // Insert payment record if paid > 0
    if (paid > 0) {
      await query(
        `INSERT INTO expense_payments (expense_id, amount, payment_method, note)
         VALUES ($1, $2, $3, $4)`,
        [expense.expense_id, paid, payment_method || 'cash', 'Initial expense payment']
      );

      // Deduct paid expense amount from system available balance!
      await updateAvailableBalance(-paid);
    }

    await logActivity({
      req,
      staffId,
      action: 'CREATE_EXPENSE',
      entity: 'expenses',
      entityId: expense.expense_id,
      details: `Created expense: ${expense.title} (Total: ৳${total}, Paid: ৳${paid})`
    });

    return Response.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
