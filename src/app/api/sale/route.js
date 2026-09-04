import { query } from '@/lib/db';
import pool from '@/lib/db';
import { authenticateUser } from '@/lib/auth';
import { recordActivityLog } from '@/lib/logger';
import { updateAvailableBalance, allocateOrderProfit } from '@/lib/financial';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let sql = `
      SELECT o.*, 
             c.name AS customer_name, 
             c.email AS customer_email,
             s.name AS staff_name,
             s.email AS staff_email,
             s.role AS staff_role,
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
    `;
    let params = [];

    if (status) {
      sql += ' WHERE o.status = $1';
      params.push(status);
    }

    sql += ' ORDER BY o.order_id DESC';

    const result = await query(sql, params);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const {
      name,
      phone,
      email,
      shipping_address,
      shipping_city,
      shipping_area,
      note,
      items,
      is_pos,
      payment_type,
      amount_received,
      change_amount,
      branch_id
    } = await req.json();

    if (!phone || (!is_pos && !shipping_address) || !items || !Array.isArray(items) || items.length === 0) {
      client.release();
      return Response.json({ error: 'Phone and items are required' }, { status: 400 });
    }

    const settingRes = await client.query('SELECT is_sale_active FROM websites LIMIT 1');
    if (settingRes.rows.length > 0 && settingRes.rows[0].is_sale_active === false) {
      client.release();
      return Response.json({ error: 'Sales are currently paused' }, { status: 403 });
    }

    const auth = await authenticateUser();
    const staffId = auth.success && auth.user ? (auth.user.staff_id || auth.user.user_id) : null;

    let creatorBranchId = auth.success && auth.user?.branch_id ? auth.user.branch_id : null;
    if (!creatorBranchId && staffId) {
      const staffBranchRes = await client.query('SELECT branch_id FROM staffs WHERE staff_id = $1', [staffId]);
      if (staffBranchRes.rows.length > 0 && staffBranchRes.rows[0].branch_id) {
        creatorBranchId = staffBranchRes.rows[0].branch_id;
      }
    }
    if (!creatorBranchId && branch_id) {
      creatorBranchId = parseInt(branch_id, 10);
    }
    if (!creatorBranchId) {
      const defaultBranchRes = await client.query('SELECT branch_id FROM branches WHERE is_active = true ORDER BY branch_id ASC LIMIT 1');
      if (defaultBranchRes.rows.length > 0) {
        creatorBranchId = defaultBranchRes.rows[0].branch_id;
      }
    }

    await client.query('BEGIN');

    let customerId = null;
    const cleanPhone = phone.trim();
    const cleanAddr = shipping_address ? shipping_address.trim() : 'In-Store POS';

    if (is_pos) {
      const checkCust = await client.query('SELECT customer_id FROM customers WHERE phone = $1 LIMIT 1', [cleanPhone]);
      if (checkCust.rows.length > 0) {
        customerId = checkCust.rows[0].customer_id;
      } else {
        const checkStaff = await client.query('SELECT name, email FROM staffs WHERE phone = $1 LIMIT 1', [cleanPhone]);
        
        let finalName = 'Guest';
        let finalEmail = 'guest@sale.com';
        let finalAddr = 'In-Store POS';

        if (checkStaff.rows.length > 0) {
          finalName = checkStaff.rows[0].name || 'Guest';
          finalEmail = checkStaff.rows[0].email || 'guest@sale.com';
        }

        const newCust = await client.query(
          `INSERT INTO customers (name, phone, email, address)
           VALUES ($1, $2, $3, $4)
           RETURNING customer_id`,
          [finalName, cleanPhone, finalEmail, finalAddr]
        );
        customerId = newCust.rows[0].customer_id;
      }
    } else {
      const cleanName = name ? name.trim() : 'Guest Customer';
      const cleanEmail = email ? email.trim() : null;

      const checkCust = await client.query('SELECT customer_id FROM customers WHERE phone = $1', [cleanPhone]);
      if (checkCust.rows.length > 0) {
        customerId = checkCust.rows[0].customer_id;
        await client.query(
          `UPDATE customers 
           SET name = COALESCE($1, name), email = COALESCE($2, email), address = COALESCE($3, address)
           WHERE customer_id = $4`,
          [cleanName, cleanEmail, cleanAddr, customerId]
        );
      } else {
        const newCust = await client.query(
          `INSERT INTO customers (name, phone, email, address)
           VALUES ($1, $2, $3, $4)
           RETURNING customer_id`,
          [cleanName, cleanPhone, cleanEmail, cleanAddr]
        );
        customerId = newCust.rows[0].customer_id;
      }
    }

    let subtotal = 0;
    let totalDiscount = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (item.variant_id) {
        const varRes = await client.query(
          `SELECT v.sale_price, v.discount_price, 
                  COALESCE((SELECT SUM(stock)::integer FROM stocks WHERE variant_id = v.variant_id), 0) AS stock, 
                  p.name, p.product_id
           FROM product_variants v
           JOIN products p ON v.product_id = p.product_id
           WHERE v.variant_id = $1`,
          [item.variant_id]
        );
        if (varRes.rows.length === 0) {
          throw new Error(`Variant ID ${item.variant_id} not found`);
        }
        const dbVar = varRes.rows[0];
        if (parseInt(dbVar.stock, 10) < item.quantity) {
          throw new Error(`Insufficient stock for variant "${dbVar.name}"`);
        }
        const salePrice = parseFloat(dbVar.sale_price);
        const discountAmt = parseFloat(dbVar.discount_price || 0);
        const finalPrice = Math.max(0, salePrice - discountAmt);

        subtotal += finalPrice * item.quantity;
        totalDiscount += discountAmt * item.quantity;

        verifiedItems.push({
          product_id: dbVar.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: finalPrice
        });
      } else {
        const prodRes = await client.query(
          `SELECT v.sale_price, v.discount_price, 
                  COALESCE((SELECT SUM(stock)::integer FROM stocks WHERE variant_id = v.variant_id), 0) AS stock, 
                  p.name
           FROM product_variants v
           JOIN products p ON v.product_id = p.product_id
           WHERE p.product_id = $1
           ORDER BY v.variant_id ASC LIMIT 1`,
          [item.product_id]
        );
        if (prodRes.rows.length === 0) {
          throw new Error(`Product ID ${item.product_id} not found`);
        }
        const dbProd = prodRes.rows[0];
        if (parseInt(dbProd.stock, 10) < item.quantity) {
          throw new Error(`Insufficient stock for product "${dbProd.name}"`);
        }
        
        const salePrice = parseFloat(dbProd.sale_price);
        const discountAmt = parseFloat(dbProd.discount_price || 0);
        const finalPrice = Math.max(0, salePrice - discountAmt);

        subtotal += finalPrice * item.quantity;
        totalDiscount += discountAmt * item.quantity;

        verifiedItems.push({
          product_id: item.product_id,
          variant_id: null,
          quantity: item.quantity,
          price: finalPrice
        });
      }
    }

    const isDhaka = shipping_city && shipping_city.trim().toLowerCase() === 'dhaka';
    const deliveryCharge = is_pos ? 0 : (isDhaka ? 70 : 130);
    const totalAmount = subtotal + deliveryCharge;

    const orderRes = await client.query(
      `INSERT INTO public.orders (
        branch_id, customer_id, staff_id, phone, shipping_address, shipping_city, shipping_area,
        status, subtotal_amount, total_discount_amount, delivery_charge,
        total_amount, due_amount, payment_type, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING order_id`,
      [
        creatorBranchId,
        customerId,
        staffId,
        cleanPhone,
        cleanAddr,
        is_pos ? 'In-Store' : (shipping_city || 'Dhaka'),
        is_pos ? '' : (shipping_area || ''),
        is_pos ? 'delivered' : 'pending',
        subtotal,
        totalDiscount,
        deliveryCharge,
        totalAmount,
        is_pos ? 0 : totalAmount, 
        is_pos ? 'prepaid' : 'cod',
        note || null
      ]
    );
    const orderId = orderRes.rows[0].order_id;

    for (const vItem of verifiedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, vItem.product_id, vItem.variant_id, vItem.quantity, vItem.price]
      );

      if (is_pos) {
        let targetVarId = vItem.variant_id;
        if (!targetVarId) {
          const defaultVarRes = await client.query(
            `SELECT variant_id FROM product_variants WHERE product_id = $1 ORDER BY variant_id ASC LIMIT 1`,
            [vItem.product_id]
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
            [vItem.quantity, targetVarId, creatorBranchId]
          );
          if (updateRes.rows.length === 0 || updateRes.rows[0].stock < 0) {
            throw new Error(`Insufficient stock for product`);
          }
        }
      }
    }

    if (is_pos) {
      await client.query(
        `INSERT INTO public.payments (order_id, payment_method, amount, amount_received, change_amount, payment_status, note)
         VALUES ($1, $2, $3, $4, $5, 'completed', 'POS sale completed in-store')`,
        [orderId, payment_type || 'cash', totalAmount, amount_received || totalAmount, change_amount || 0]
      );
    } else {
      await client.query(
        `INSERT INTO public.payments (order_id, payment_method, amount, amount_received, change_amount, payment_status, note)
         VALUES ($1, 'cod', $2, 0, 0, 'pending', 'Pending cash on delivery storefront order')`,
        [orderId, totalAmount]
      );
    }

    await client.query('COMMIT');

    if (is_pos) {
      await updateAvailableBalance(totalAmount);
      await allocateOrderProfit(orderId);
    }

    await recordActivityLog(req, {
      staffId,
      action: is_pos ? 'CREATE_POS_SALE' : 'CREATE_ONLINE_ORDER',
      entity: 'orders',
      entityId: orderId,
      details: `Order #${orderId} created for customer ${cleanPhone} (Total: BDT ${totalAmount})`
    });

    const customerRes = await client.query(
      'SELECT name, phone, email, address FROM customers WHERE customer_id = $1',
      [customerId]
    );
    const customerDetails = customerRes.rows[0];

    return Response.json({
      message: 'POS Order placed successfully!',
      order_id: orderId,
      total_amount: totalAmount,
      customer: customerDetails
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation transaction failed:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
