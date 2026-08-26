import toast from 'react-hot-toast';
import { STORE_NAME } from '@/lib/secret';

export function printReceipt(order, website) {
  if (!order) return;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    toast.error('Pop-up blocked! Please allow pop-ups to print invoices.');
    return;
  }

  const storeName = STORE_NAME;
  const storePhone = website?.phone || 'N/A';
  const storeEmail = website?.email || 'support@ecom.com';
  const storeAddress = website?.address || 'Dhaka, Bangladesh';

  const orderId = order.order_id;
  const createdAt = order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString();
  const customerName = order.customer_name || 'Customer';
  const customerPhone = order.phone || 'N/A';
  const customerAddress = order.shipping_address || 'N/A';
  const customerCity = order.shipping_city || '';
  const customerArea = order.shipping_area || '';
  const fullAddress = `${customerAddress}${customerCity ? ', ' + customerCity : ''}${customerArea ? ' (' + customerArea + ')' : ''}`;

  const subtotal = parseFloat(order.subtotal_amount || 0);
  const discount = parseFloat(order.total_discount_amount || 0);
  const delivery = parseFloat(order.delivery_charge || 0);
  const total = parseFloat(order.total_amount || 0);
  const due = parseFloat(order.due_amount || 0);
  const paid = total - due;

  const items = order.items || [];

  const itemsRows = items.map((item) => {
    const itemName = item.product_name || 'Product';
    const variantName = item.variant_name ? ` (${item.variant_name})` : '';
    const itemQty = parseInt(item.quantity || 1, 10);
    const itemPrice = parseFloat(item.price || 0);
    const itemTotal = itemPrice * itemQty;

    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: left; vertical-align: top;">
          <div style="font-weight: 600; color: #1e293b;">${itemName}</div>
          ${variantName ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">Option: ${variantName}</div>` : ''}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155; font-family: monospace;">৳${itemPrice.toFixed(2)}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155; font-family: monospace;">${itemQty}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-family: monospace;">৳${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #ORD-${orderId}</title>
        <style>
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            color: #334155;
            margin: 0;
            padding: 40px;
            background-color: #fff;
            line-height: 1.5;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .store-title {
            font-size: 28px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.025em;
            text-transform: uppercase;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            text-align: right;
            letter-spacing: -0.025em;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.05em;
            padding: 12px 10px;
            border-bottom: 2px solid #e2e8f0;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            border-collapse: collapse;
            font-size: 13px;
          }
          .totals-table td {
            padding: 8px 0;
            color: #475569;
          }
          .totals-table .grand-total {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            border-top: 2px solid #e2e8f0;
            padding-top: 12px;
            margin-top: 4px;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 20px;
            color: #64748b;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          
          <!-- Header block -->
          <table class="header-table">
            <tr>
              <td>
                <div class="store-title">${storeName}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                  ${storeAddress}<br>
                  Phone: ${storePhone} | Email: ${storeEmail}
                </div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div class="invoice-title">INVOICE</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600;">
                  Order ID: #ORD-${orderId}<br>
                  Date: ${createdAt}
                </div>
              </td>
            </tr>
          </table>

          <!-- Details block -->
          <table class="details-table">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 6px;">Bill To</div>
                <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${customerName}</div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.4;">
                  Phone: ${customerPhone}<br>
                  Address: ${fullAddress}
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 6px;">Payment Information</div>
                <div style="font-size: 12px; color: #475569; line-height: 1.6;">
                  Payment Status: <span style="font-weight: 700; text-transform: uppercase; color: ${due <= 0 ? '#10b981' : '#f59e0b'}">${due <= 0 ? 'Paid' : 'Due'}</span><br>
                  Payment Type: <span style="font-weight: 700; text-transform: uppercase;">${(order.payment_type || 'cod').replace('_', ' ')}</span><br>
                  Current Status: <span style="font-weight: 700; text-transform: uppercase;">${order.status}</span>
                </div>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 50%;">Item Description</th>
                <th style="text-align: center; width: 18%;">Unit Price</th>
                <th style="text-align: center; width: 12%;">Qty</th>
                <th style="text-align: right; width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Totals block -->
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right; font-weight: 600; color: #334155; font-family: monospace;">৳${subtotal.toFixed(2)}</td>
            </tr>
            ${discount > 0 ? `
            <tr style="color: #e11d48;">
              <td>Discount</td>
              <td style="text-align: right; font-weight: 600; font-family: monospace;">-৳${discount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Delivery Surcharge</td>
              <td style="text-align: right; font-weight: 600; color: #334155; font-family: monospace;">৳${delivery.toFixed(2)}</td>
            </tr>
            <tr class="grand-total">
              <td style="font-weight: 700;">Grand Total</td>
              <td style="text-align: right; font-weight: 850; color: #0f172a; font-family: monospace;">৳${total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #059669;">Amount Paid</td>
              <td style="text-align: right; font-weight: 700; color: #059669; font-family: monospace;">৳${paid.toFixed(2)}</td>
            </tr>
            ${due > 0 ? `
            <tr style="color: #dc2626;">
              <td style="font-weight: 700;">Remaining Balance Due</td>
              <td style="text-align: right; font-weight: 800; font-family: monospace;">৳${due.toFixed(2)}</td>
            </tr>
            ` : ''}
          </table>

          <!-- Order Note -->
          ${order.note ? `
          <div style="margin-top: 30px; border-left: 3px solid #cbd5e1; padding-left: 12px; font-size: 11px; color: #64748b; font-style: italic;">
            Note: "${order.note}"
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <p style="font-weight: 700; color: #475569; margin-bottom: 4px;">Thank you for shopping with us!</p>
            <p style="margin: 0;">This is a computer-generated invoice receipt.</p>
          </div>

        </div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
