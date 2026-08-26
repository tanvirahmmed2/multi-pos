import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req) {
  try {
    // 1. Authenticate user
    const auth = await authenticateUser();
    if (!auth.success || !auth.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = ['admin', 'manager'].includes(auth.user.role);
    if (!isStaff) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type) {
      return Response.json({ error: 'Missing export type parameter' }, { status: 400 });
    }

    let rows = [];
    let filename = '';

    switch (type) {
      case 'customers': {
        const result = await query(
          'SELECT customer_id, name, phone, email, address, created_at FROM customers ORDER BY customer_id ASC'
        );
        rows = result.rows;
        filename = 'customers_report';
        break;
      }
      case 'payments': {
        const result = await query(`
          SELECT 
            py.payment_id, 
            py.order_id, 
            o.phone AS customer_phone,
            py.payment_method, 
            py.transaction_id, 
            py.amount, 
            py.amount_received, 
            py.change_amount, 
            py.payment_status, 
            py.paid_at, 
            py.note
          FROM public.payments py
          JOIN public.orders o ON py.order_id = o.order_id
          ORDER BY py.payment_id DESC
        `);
        rows = result.rows;
        filename = 'payments_report';
        break;
      }
      case 'purchases': {
        const result = await query(`
          SELECT 
            p.purchase_id, 
            p.supplier_name, 
            p.supplier_phone, 
            p.invoice_no, 
            p.subtotal_amount, 
            p.extra_discount, 
            p.total_amount, 
            COALESCE(SUM(pm.amount_paid), 0)::numeric AS total_paid,
            (p.total_amount - COALESCE(SUM(pm.amount_paid), 0))::numeric AS due_amount,
            p.payment_method, 
            p.transaction_id, 
            p.note, 
            p.created_at
          FROM purchases p
          LEFT JOIN purchase_payments pm ON p.purchase_id = pm.purchase_id
          GROUP BY p.purchase_id
          ORDER BY p.purchase_id DESC
        `);
        rows = result.rows;
        filename = 'purchases_report';
        break;
      }
      case 'sales': {
        const result = await query(`
          SELECT o.*, c.name AS customer_name, c.email AS customer_email,
                 (SELECT JSON_AGG(JSON_BUILD_OBJECT(
                    'product_name', p.name,
                    'variant_name', pv.variant_name,
                    'quantity', oi.quantity
                 )) FROM order_items oi
                 JOIN products p ON oi.product_id = p.product_id
                 LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
                 WHERE oi.order_id = o.order_id) AS items
          FROM public.orders o
          LEFT JOIN customers c ON o.customer_id = c.customer_id
          ORDER BY o.order_id DESC
        `);

        // Format items array into readable string for Excel
        rows = result.rows.map(r => {
          const itemsStr = r.items
            ? r.items.map(item => `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''} x${item.quantity}`).join('; ')
            : 'N/A';
          
          const { items, ...rest } = r;
          return {
            ...rest,
            products_summary: itemsStr
          };
        });

        filename = 'sales_orders_report';
        break;
      }
      case 'products': {
        const result = await query(`
          SELECT 
            p.product_id, 
            p.name AS product_name,
            v.variant_name,
            v.barcode,
            c.name AS category_name, 
            b.name AS brand_name, 
            v.purchase_price, 
            v.sale_price, 
            v.discount_price, 
            v.wholesale_price, 
            v.dealer_price, 
            v.retail_price, 
            v.stock, 
            v.unit,
            v.is_active AS variant_active, 
            p.created_at
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.category_id
          LEFT JOIN brands b ON p.brand_id = b.brand_id
          JOIN product_variants v ON p.product_id = v.product_id
          ORDER BY p.product_id ASC, v.variant_id ASC
        `);
        rows = result.rows;
        filename = 'products_report';
        break;
      }
      default:
        return Response.json({ error: 'Invalid export type parameter' }, { status: 400 });
    }

    if (rows.length === 0) {
      const worksheet = XLSX.utils.json_to_sheet([]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'No Data');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}_empty_${Date.now()}.xlsx"`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
    }

    const formattedRows = rows.map(row => {
      const formatted = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        let value = row[key];
        if (value instanceof Date) {
          value = value.toLocaleString();
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            value = parsedDate.toLocaleString();
          }
        }
        
        formatted[cleanKey] = value;
      });
      return formatted;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}_${Date.now()}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

  } catch (error) {
    console.error('Export Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
