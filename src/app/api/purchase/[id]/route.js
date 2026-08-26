import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const purchaseId = parseInt(id, 10);

    // Fetch purchase metadata with sum of paid amount
    const purchaseRes = await query(`
      SELECT 
        p.*, 
        COALESCE(SUM(pm.amount_paid), 0)::numeric AS total_paid,
        (p.total_amount - COALESCE(SUM(pm.amount_paid), 0))::numeric AS due_amount
      FROM purchases p
      LEFT JOIN purchase_payments pm ON p.purchase_id = pm.purchase_id
      WHERE p.purchase_id = $1
      GROUP BY p.purchase_id
    `, [purchaseId]);

    if (purchaseRes.rows.length === 0) {
      return Response.json({ error: 'Purchase invoice not found' }, { status: 404 });
    }

    const purchase = purchaseRes.rows[0];

    // Fetch items
    const itemsRes = await query(`
      SELECT 
        pi.*, 
        p.name AS product_name, 
        pv.variant_name 
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.product_id
      LEFT JOIN product_variants pv ON pi.variant_id = pv.variant_id
      WHERE pi.purchase_id = $1
      ORDER BY pi.id ASC
    `, [purchaseId]);

    // Fetch payments
    const paymentsRes = await query(`
      SELECT * 
      FROM purchase_payments 
      WHERE purchase_id = $1
      ORDER BY payment_id ASC
    `, [purchaseId]);

    return Response.json({
      ...purchase,
      items: itemsRes.rows,
      payments: paymentsRes.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching purchase invoice detail:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const purchaseId = parseInt(id, 10);

    // Fetch purchase items to reverse stock
    const itemsRes = await query('SELECT * FROM purchase_items WHERE purchase_id = $1', [purchaseId]);
    if (itemsRes.rows.length === 0) {
      // Check if purchase exists at all
      const checkRes = await query('SELECT * FROM purchases WHERE purchase_id = $1', [purchaseId]);
      if (checkRes.rows.length === 0) {
        return Response.json({ error: 'Purchase invoice not found' }, { status: 404 });
      }
    }

    // Begin Database Transaction
    await query('BEGIN');

    // Reverse stocks
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
          `UPDATE product_variants 
           SET stock = GREATEST(stock - $1, 0) 
           WHERE variant_id = $2`,
          [item.quantity, targetVarId]
        );
      }
    }

    // Delete inventory logs
    await query('DELETE FROM inventory_logs WHERE reference_id = $1 AND type = \'purchase\'', [purchaseId]);

    // Delete purchase payments
    await query('DELETE FROM purchase_payments WHERE purchase_id = $1', [purchaseId]);

    // Delete purchase items
    await query('DELETE FROM purchase_items WHERE purchase_id = $1', [purchaseId]);

    // Delete purchase record
    await query('DELETE FROM purchases WHERE purchase_id = $1', [purchaseId]);

    await query('COMMIT');

    return Response.json({ message: 'Purchase invoice deleted and inventory reverted successfully' }, { status: 200 });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error deleting purchase invoice:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
