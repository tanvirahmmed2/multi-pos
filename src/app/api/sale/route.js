import { query } from '@/lib/db';
import pool from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let sql = `
      SELECT o.*, c.name AS customer_name, c.email AS customer_email,
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
      change_amount
    } = await req.json();

    if (!phone || (!is_pos && !shipping_address) || !items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Phone and items are required' }, { status: 400 });
    }

    // Optional: Get logged in user if any
    const auth = await authenticateUser();
    const userId = auth.success ? auth.user.user_id : null;

    // Start Transaction
    await client.query('BEGIN');

    // 1. Customer profile upsert
    let customerId = null;
    const cleanPhone = phone.trim();
    const cleanAddr = shipping_address ? shipping_address.trim() : 'In-Store POS';

    if (is_pos) {
      const checkCust = await client.query('SELECT customer_id FROM customers WHERE phone = $1 LIMIT 1', [cleanPhone]);
      if (checkCust.rows.length > 0) {
        customerId = checkCust.rows[0].customer_id;
      } else {
        // Customer profile not found. Check if a registered user exists with this phone number
        const checkUser = await client.query('SELECT name, email FROM users WHERE phone = $1 LIMIT 1', [cleanPhone]);
        
        let finalName = 'Guest';
        let finalEmail = 'guest@sale.com';
        let finalAddr = 'In-Store POS';

        if (checkUser.rows.length > 0) {
          finalName = checkUser.rows[0].name || 'Guest';
          finalEmail = checkUser.rows[0].email || 'guest@sale.com';
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

    // 2. Server-side price verification and stock checks
    let subtotal = 0;
    let totalDiscount = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (item.variant_id) {
        // Variant item details lookup
        const varRes = await client.query(
          `SELECT v.sale_price, v.discount_price, v.stock, p.name, p.product_id
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
        // Simple item details lookup - resolve from default variant
        const prodRes = await client.query(
          `SELECT v.sale_price, v.discount_price, v.stock, p.name
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

    // Calculate delivery charge (70 BDT in Dhaka, 130 BDT everywhere else. POS is 0 BDT)
    const isDhaka = shipping_city && shipping_city.trim().toLowerCase() === 'dhaka';
    const deliveryCharge = is_pos ? 0 : (isDhaka ? 70 : 130);
    const totalAmount = subtotal + deliveryCharge;

    // 3. Create order
    const orderRes = await client.query(
      `INSERT INTO public.orders (
        customer_id, phone, shipping_address, shipping_city, shipping_area,
        status, subtotal_amount, total_discount_amount, delivery_charge,
        total_amount, due_amount, payment_type, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING order_id`,
      [
        customerId,
        cleanPhone,
        cleanAddr,
        is_pos ? 'In-Store' : (shipping_city || 'Dhaka'),
        is_pos ? '' : (shipping_area || ''),
        is_pos ? 'delivered' : 'pending',
        subtotal,
        totalDiscount,
        deliveryCharge,
        totalAmount,
        is_pos ? 0 : totalAmount, // POS is fully paid (due = 0), COD has full due until delivery
        is_pos ? 'prepaid' : 'cod',
        note || null
      ]
    );
    const orderId = orderRes.rows[0].order_id;

    // 4. Create order items and decrement stock immediately if POS
    for (const vItem of verifiedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, vItem.product_id, vItem.variant_id, vItem.quantity, vItem.price]
      );

      if (is_pos) {
        if (vItem.variant_id) {
          const updateRes = await client.query(
            `UPDATE product_variants 
             SET stock = stock - $1 
             WHERE variant_id = $2
             RETURNING stock, variant_name`,
            [vItem.quantity, vItem.variant_id]
          );
          if (updateRes.rows.length > 0 && updateRes.rows[0].stock < 0) {
            throw new Error(`Insufficient stock for variant "${updateRes.rows[0].variant_name}"`);
          }
        } else {
          // Find default variant
          const defaultVarRes = await client.query(
            `SELECT variant_id FROM product_variants WHERE product_id = $1 ORDER BY variant_id ASC LIMIT 1`,
            [vItem.product_id]
          );
          if (defaultVarRes.rows.length > 0) {
            const targetVarId = defaultVarRes.rows[0].variant_id;
            const updateRes = await client.query(
              `UPDATE product_variants 
               SET stock = stock - $1 
               WHERE variant_id = $2
               RETURNING stock, variant_name AS name`,
              [vItem.quantity, targetVarId]
            );
            if (updateRes.rows.length > 0 && updateRes.rows[0].stock < 0) {
              throw new Error(`Insufficient stock for product variant`);
            }
          } else {
            throw new Error(`Default variant not found for product ID ${vItem.product_id}`);
          }
        }
      }
    }

    // 5. Create payment record
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

    // Commit Transaction
    await client.query('COMMIT');

    // Fetch customer details to return to the frontend
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
