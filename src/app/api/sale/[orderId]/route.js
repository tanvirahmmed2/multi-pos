import { query } from '@/lib/db';
import pool from '@/lib/db';
import { authenticateUser } from '@/lib/auth';
import { updateAvailableBalance, allocateOrderProfit } from '@/lib/financial';

export async function GET(req, { params }) {
  try {
    const { orderId } = await params;
    const orderRes = await query(
      `SELECT o.*, 
              c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
              s.name AS staff_name, s.email AS staff_email, s.role AS staff_role,
              b.name AS branch_name,
              p_last.amount_received, p_last.change_amount,
              (SELECT JSON_AGG(JSON_BUILD_OBJECT(
                 'order_item_id', oi.order_item_id,
                 'product_id', oi.product_id,
                 'variant_id', oi.variant_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'product_name', p.name,
                 'product_image', COALESCE(pv.image, (SELECT image FROM product_variants WHERE product_id = p.product_id ORDER BY variant_id ASC LIMIT 1)),
                 'variant_name', pv.variant_name
              )) FROM order_items oi
              JOIN products p ON oi.product_id = p.product_id
              LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
              WHERE oi.order_id = o.order_id) AS items
       FROM public.orders o
       LEFT JOIN customers c ON o.customer_id = c.customer_id
       LEFT JOIN staffs s ON o.staff_id = s.staff_id
       LEFT JOIN branches b ON s.branch_id = b.branch_id
       LEFT JOIN LATERAL (
         SELECT amount_received, change_amount FROM public.payments WHERE order_id = o.order_id ORDER BY payment_id DESC LIMIT 1
       ) p_last ON true
       WHERE o.order_id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json(orderRes.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const client = await pool.connect();
  try {
    const { orderId } = await params;
    const { status, courier_name, courier_tracking_id, payment_amount, payment_method, note } = await req.json();

    const allowedStatuses = [
      'pending', 'confirmed', 'processing', 'shipped', 
      'out_for_delivery', 'delivered', 'cancelled', 
      'returned', 'failed'
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return Response.json({ error: 'Invalid or missing status value' }, { status: 400 });
    }

    await client.query('BEGIN');

    const orderRes = await client.query(
      `SELECT status, total_amount, due_amount, branch_id FROM public.orders WHERE order_id = $1 FOR UPDATE`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0];
    const oldStatus = order.status;
    const newStatus = status;
    const orderBranchId = order.branch_id || 1;

    const deductStock = async () => {
      const itemsRes = await client.query(
        `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );
      for (const item of itemsRes.rows) {
        let targetVarId = item.variant_id;
        if (!targetVarId) {
          const defaultVarRes = await client.query(
            `SELECT variant_id FROM product_variants WHERE product_id = $1 ORDER BY variant_id ASC LIMIT 1`,
            [item.product_id]
          );
          if (defaultVarRes.rows.length > 0) {
            targetVarId = defaultVarRes.rows[0].variant_id;
          }
        }
        if (targetVarId) {
          const updateRes = await client.query(
            `UPDATE stocks 
             SET stock = stock - $1, updated_at = NOW() 
             WHERE variant_id = $2 AND branch_id = $3
             RETURNING stock`,
            [item.quantity, targetVarId, orderBranchId]
          );
          if (updateRes.rows.length === 0 || updateRes.rows[0].stock < 0) {
            throw new Error(`Insufficient stock for product/variant`);
          }
        }
      }
    };

    const addStockBack = async () => {
      const itemsRes = await client.query(
        `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );
      for (const item of itemsRes.rows) {
        let targetVarId = item.variant_id;
        if (!targetVarId) {
          const defaultVarRes = await client.query(
            `SELECT variant_id FROM product_variants WHERE product_id = $1 ORDER BY variant_id ASC LIMIT 1`,
            [item.product_id]
          );
          if (defaultVarRes.rows.length > 0) {
            targetVarId = defaultVarRes.rows[0].variant_id;
          }
        }
        if (targetVarId) {
          await client.query(
            `INSERT INTO stocks (variant_id, branch_id, stock) VALUES ($1, $2, $3)
             ON CONFLICT (variant_id, branch_id)
             DO UPDATE SET stock = stocks.stock + EXCLUDED.stock, updated_at = NOW()`,
            [targetVarId, orderBranchId, item.quantity]
          );
        }
      }
    };

    let stockWasReduced = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(oldStatus);
    let stockShouldBeReduced = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(newStatus);

    if (!stockWasReduced && stockShouldBeReduced) {
      await deductStock();
    }

    if (stockWasReduced && !stockShouldBeReduced) {
      await addStockBack();
    }

    if (newStatus === 'returned' || newStatus === 'cancelled') {
      if (!stockWasReduced) {
        await addStockBack();
      }
      stockShouldBeReduced = false;
    }

    let updateDueAmount = parseFloat(order.due_amount || 0);
    let collectedPayment = 0;

    if (newStatus === 'returned' || newStatus === 'cancelled') {
      updateDueAmount = 0;
    } else if (payment_amount !== undefined && payment_amount !== null && parseFloat(payment_amount) > 0) {
      const payAmount = parseFloat(payment_amount);
      const method = payment_method || 'cash';
      const payNote = note || `Payment received during status change to ${newStatus}`;

      await client.query(
        `INSERT INTO public.payments (order_id, payment_method, amount, amount_received, change_amount, payment_status, note)
         VALUES ($1, $2, $3, $3, 0, 'completed', $4)`,
        [orderId, method, payAmount, payNote]
      );
      updateDueAmount = Math.max(0, updateDueAmount - payAmount);
      collectedPayment = payAmount;
    } else if (newStatus === 'delivered') {
      const payRes = await client.query(
        `SELECT payment_id FROM public.payments WHERE order_id = $1 AND payment_status = 'completed'`,
        [orderId]
      );
      if (payRes.rows.length === 0 && updateDueAmount > 0) {
        await client.query(
          `INSERT INTO public.payments (order_id, payment_method, amount, amount_received, change_amount, payment_status, note)
           VALUES ($1, 'cod', $2, $2, 0, 'completed', 'COD payment received on delivery')`,
          [orderId, updateDueAmount]
        );
        collectedPayment = updateDueAmount;
      }
      updateDueAmount = 0;
    }

    await client.query(
      `UPDATE public.orders 
       SET status = $1::text, 
           subtotal_amount = CASE WHEN $1::text = 'returned' THEN 0 ELSE subtotal_amount END,
           total_discount_amount = CASE WHEN $1::text = 'returned' THEN 0 ELSE total_discount_amount END,
           delivery_charge = CASE WHEN $1::text = 'returned' THEN 0 ELSE delivery_charge END,
           total_amount = CASE WHEN $1::text = 'returned' THEN 0 ELSE total_amount END,
           due_amount = $2, 
           courier_name = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE courier_name END,
           courier_tracking_id = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE courier_tracking_id END,
           updated_at = NOW() 
       WHERE order_id = $5`,
      [newStatus, updateDueAmount, courier_name || null, courier_tracking_id || null, orderId]
    );

    await client.query('COMMIT');

    if (collectedPayment > 0) {
      await updateAvailableBalance(collectedPayment);
    }
    if (newStatus === 'delivered') {
      await allocateOrderProfit(orderId);
    }
    return Response.json({ message: 'Order status updated successfully' }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order status update failed:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req, { params }) {
  const client = await pool.connect();
  try {
    const { orderId } = await params;
    await client.query('BEGIN');

    await client.query('DELETE FROM public.order_items WHERE order_id = $1', [orderId]);
    await client.query('DELETE FROM public.payments WHERE order_id = $1', [orderId]);

    const res = await client.query('DELETE FROM public.orders WHERE order_id = $1 RETURNING order_id', [orderId]);
    if (res.rows.length === 0) {
      await client.query('ROLLBACK');
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    return Response.json({ message: 'Order deleted successfully' }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to delete order:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}

