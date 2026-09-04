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

    const purchaseRes = await query(`
      SELECT 
        p.*, 
        s.name AS staff_name,
        s.email AS staff_email,
        s.role AS staff_role,
        b.name AS branch_name,
        b.code AS branch_code,
        COALESCE(SUM(pm.amount_paid), 0)::numeric AS total_paid,
        (p.total_amount - COALESCE(SUM(pm.amount_paid), 0))::numeric AS due_amount
      FROM purchases p
      LEFT JOIN purchase_payments pm ON p.purchase_id = pm.purchase_id
      LEFT JOIN staffs s ON p.staff_id = s.staff_id
      LEFT JOIN branches b ON p.branch_id = b.branch_id
      WHERE p.purchase_id = $1
      GROUP BY p.purchase_id, s.staff_id, b.branch_id
    `, [purchaseId]);

    if (purchaseRes.rows.length === 0) {
      return Response.json({ error: 'Purchase invoice not found' }, { status: 404 });
    }

    const purchase = purchaseRes.rows[0];

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

    const purchaseCheck = await query('SELECT branch_id FROM purchases WHERE purchase_id = $1', [purchaseId]);
    if (purchaseCheck.rows.length === 0) {
      return Response.json({ error: 'Purchase invoice not found' }, { status: 404 });
    }
    const purchaseBranchId = purchaseCheck.rows[0].branch_id || 1;

    const itemsRes = await query('SELECT * FROM purchase_items WHERE purchase_id = $1', [purchaseId]);

    await query('BEGIN');

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
          `UPDATE stocks 
           SET stock = GREATEST(stock - $1, 0), updated_at = NOW() 
           WHERE variant_id = $2 AND branch_id = $3`,
          [item.quantity, targetVarId, purchaseBranchId]
        );
      }
    }

    await query('DELETE FROM inventory_logs WHERE reference_id = $1 AND type = \'purchase\'', [purchaseId]);

    await query('DELETE FROM purchase_payments WHERE purchase_id = $1', [purchaseId]);

    await query('DELETE FROM purchase_items WHERE purchase_id = $1', [purchaseId]);

    await query('DELETE FROM purchases WHERE purchase_id = $1', [purchaseId]);

    await query('COMMIT');

    return Response.json({ message: 'Purchase invoice deleted and inventory reverted successfully' }, { status: 200 });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error deleting purchase invoice:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
