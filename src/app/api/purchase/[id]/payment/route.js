import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const purchaseId = parseInt(id, 10);

    const body = await req.json();
    const { amount_paid, payment_method = 'Cash', transaction_id = '' } = body;

    const amount = parseFloat(amount_paid);
    if (isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Fetch purchase metadata and calculate due
    const purchaseRes = await query(`
      SELECT 
        p.total_amount, 
        COALESCE(SUM(pm.amount_paid), 0)::numeric AS total_paid
      FROM purchases p
      LEFT JOIN purchase_payments pm ON p.purchase_id = pm.purchase_id
      WHERE p.purchase_id = $1
      GROUP BY p.purchase_id
    `, [purchaseId]);

    if (purchaseRes.rows.length === 0) {
      return Response.json({ error: 'Purchase invoice not found' }, { status: 404 });
    }

    const purchase = purchaseRes.rows[0];
    const totalAmount = parseFloat(purchase.total_amount);
    const totalPaid = parseFloat(purchase.total_paid);
    const due = totalAmount - totalPaid;

    if (due <= 0) {
      return Response.json({ error: 'This invoice is already fully paid' }, { status: 400 });
    }

    if (amount > due + 0.01) { // Adding small delta for precision
      return Response.json({ error: `Payment amount $${amount} exceeds remaining due amount $${due.toFixed(2)}` }, { status: 400 });
    }

    // Insert subsequent payment
    const result = await query(
      `INSERT INTO purchase_payments (purchase_id, payment_method, amount_paid, transaction_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [purchaseId, payment_method, amount, transaction_id]
    );

    return Response.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error('Error logging purchase payment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
