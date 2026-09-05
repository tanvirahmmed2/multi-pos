import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';
import { updateAvailableBalance, getAvailableBalance } from '@/lib/financial';

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

    const currentBal = await getAvailableBalance();
    if (amount > currentBal) {
      return Response.json({ 
        error: `Insufficient available balance (৳${currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Purchase payment (৳${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds available balance.` 
      }, { status: 400 });
    }

    const purchaseRes = await query(`
      SELECT 
        p.purchase_id,
        p.branch_id,
        p.invoice_no,
        p.total_amount, 
        p.stock_added,
        p.is_paid,
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

    if (amount > due + 0.01) { 
      return Response.json({ error: `Payment amount ৳${amount} exceeds remaining due amount ৳${due.toFixed(2)}` }, { status: 400 });
    }

    await query('BEGIN');

    const paymentRes = await query(
      `INSERT INTO purchase_payments (purchase_id, payment_method, amount_paid, transaction_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [purchaseId, payment_method, amount, transaction_id]
    );

    const newTotalPaid = totalPaid + amount;
    const isNowFullyPaid = newTotalPaid >= (totalAmount - 0.01);
    const effectiveBranchId = purchase.branch_id || 1;

    let stockJustAdded = false;

    if (isNowFullyPaid) {
      // If purchase was unpaid previously and stock was not added, add stock now
      if (!purchase.stock_added) {
        const itemsRes = await query('SELECT * FROM purchase_items WHERE purchase_id = $1', [purchaseId]);

        for (const item of itemsRes.rows) {
          let targetVarId = item.variant_id;
          if (!targetVarId) {
            const defaultVarRes = await query(
              `SELECT variant_id FROM product_variants WHERE product_id = $1 ORDER BY variant_id ASC LIMIT 1`,
              [item.product_id]
            );
            if (defaultVarRes.rows.length > 0) {
              targetVarId = defaultVarRes.rows[0].variant_id;
            }
          }

          if (targetVarId) {
            await query(
              `INSERT INTO stocks (variant_id, branch_id, stock)
               VALUES ($1, $2, $3)
               ON CONFLICT (variant_id, branch_id)
               DO UPDATE SET stock = stocks.stock + EXCLUDED.stock, updated_at = NOW()`,
              [targetVarId, effectiveBranchId, item.quantity]
            );
          }

          await query(
            `INSERT INTO inventory_logs (product_id, type, quantity, reference_id, note)
             VALUES ($1, 'purchase', $2, $3, $4)`,
            [item.product_id, item.quantity, purchaseId, `Purchase Invoice #${purchase.invoice_no || purchaseId}`]
          );
        }
        stockJustAdded = true;
      }

      await query(
        `UPDATE purchases 
         SET is_paid = TRUE, payment_status = 'paid', stock_added = TRUE 
         WHERE purchase_id = $1`,
        [purchaseId]
      );
    } else {
      await query(
        `UPDATE purchases 
         SET payment_status = 'partial' 
         WHERE purchase_id = $1`,
        [purchaseId]
      );
    }

    await query('COMMIT');

    await updateAvailableBalance(-amount);

    return Response.json({
      payment: paymentRes.rows[0],
      is_paid: isNowFullyPaid,
      stock_added: stockJustAdded || purchase.stock_added,
      message: isNowFullyPaid 
        ? (stockJustAdded ? 'Payment recorded, invoice marked as PAID and product stock ingested into inventory!' : 'Payment recorded, invoice marked as PAID!')
        : 'Payment recorded successfully'
    }, { status: 201 });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error logging purchase payment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
