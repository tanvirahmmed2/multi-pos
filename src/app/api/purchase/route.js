import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';
import { recordActivityLog } from '@/lib/logger';

export async function GET(req) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query(`
      SELECT 
        p.*, 
        s.name AS staff_name,
        s.email AS staff_email,
        s.role AS staff_role,
        COALESCE(SUM(pm.amount_paid), 0)::numeric AS total_paid,
        (p.total_amount - COALESCE(SUM(pm.amount_paid), 0))::numeric AS due_amount
      FROM purchases p
      LEFT JOIN purchase_payments pm ON p.purchase_id = pm.purchase_id
      LEFT JOIN staffs s ON p.staff_id = s.staff_id
      GROUP BY p.purchase_id, s.staff_id
      ORDER BY p.purchase_id DESC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const staffId = auth.user ? (auth.user.staff_id || auth.user.user_id) : null;

    const body = await req.json();
    const { 
      supplier_id, 
      invoice_no, 
      extra_discount = 0, 
      note = '', 
      payment_method = 'Cash', 
      transaction_id = '', 
      amount_paid = 0, 
      items = [] 
    } = body;

    if (!items || items.length === 0) {
      return Response.json({ error: 'At least one purchase item is required' }, { status: 400 });
    }

    let sName = 'Walk-in Supplier';
    let sPhone = 'N/A';
    const parsedSupplierId = supplier_id ? parseInt(supplier_id, 10) : null;
    
    if (parsedSupplierId) {
      const supRes = await query('SELECT name, phone FROM suppliers WHERE supplier_id = $1', [parsedSupplierId]);
      if (supRes.rows.length > 0) {
        sName = supRes.rows[0].name;
        sPhone = supRes.rows[0].phone;
      }
    }

    await query('BEGIN');

    let subtotal = 0;
    for (const item of items) {
      const q = parseInt(item.quantity, 10) || 0;
      const price = parseFloat(item.purchase_price) || 0;
      subtotal += q * price;
    }

    const total = subtotal - parseFloat(extra_discount);

    const purchaseRes = await query(
      `INSERT INTO purchases (
        supplier_id, staff_id, supplier_name, supplier_phone, invoice_no, 
        subtotal_amount, extra_discount, total_amount, payment_method, transaction_id, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        parsedSupplierId, staffId, sName, sPhone, invoice_no || null,
        subtotal, extra_discount, total, payment_method, transaction_id, note
      ]
    );

    const purchase = purchaseRes.rows[0];
    const purchaseId = purchase.purchase_id;

    for (const item of items) {
      const prodId = parseInt(item.product_id, 10);
      const varId = item.variant_id ? parseInt(item.variant_id, 10) : null;
      const q = parseInt(item.quantity, 10);
      const price = parseFloat(item.purchase_price);

      await query(
        `INSERT INTO purchase_items (purchase_id, product_id, variant_id, quantity, purchase_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchaseId, prodId, varId, q, price]
      );

      let targetVarId = varId;
      if (!targetVarId) {
        const defaultVarRes = await query(
          `SELECT variant_id FROM product_variants WHERE product_id = $1 ORDER BY variant_id ASC LIMIT 1`,
          [prodId]
        );
        if (defaultVarRes.rows.length > 0) {
          targetVarId = defaultVarRes.rows[0].variant_id;
        }
      }

      if (targetVarId) {
        await query(
          `UPDATE product_variants 
           SET stock = stock + $1 
           WHERE variant_id = $2`,
          [q, targetVarId]
        );
      }

      await query(
        `INSERT INTO inventory_logs (product_id, type, quantity, reference_id, note)
         VALUES ($1, 'purchase', $2, $3, $4)`,
        [prodId, q, purchaseId, `Purchase Invoice #${invoice_no || purchaseId}`]
      );
    }

    const initialPaid = parseFloat(amount_paid) || 0;
    if (initialPaid > 0) {
      await query(
        `INSERT INTO purchase_payments (purchase_id, payment_method, amount_paid, transaction_id)
         VALUES ($1, $2, $3, $4)`,
        [purchaseId, payment_method, initialPaid, transaction_id]
      );
    }

    await query('COMMIT');

    await recordActivityLog(req, {
      staffId,
      action: 'CREATE_PURCHASE_INVOICE',
      entity: 'purchases',
      entityId: purchaseId,
      details: `Purchase Invoice #${invoice_no || purchaseId} logged for supplier ${sName}`
    });

    return Response.json(purchase, { status: 201 });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error creating purchase invoice:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
