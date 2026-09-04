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

  const branchName = order.branch_name || order.branch || website?.branch_name || order.staff_branch || 'Main Branch';

  const orderId = order.order_id;
  const createdAt = order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString();
  const paymentType = (order.payment_type || order.payment_method || 'cod').replace(/_/g, ' ');

  const customerName = order.customer_name || 'Customer';
  const customerPhone = order.phone || order.customer_phone || 'N/A';
  const customerAddress = order.shipping_address || '';
  const customerCity = order.shipping_city || '';
  const customerArea = order.shipping_area || '';
  const fullAddress = [customerAddress, customerCity, customerArea].filter(Boolean).join(', ') || 'N/A';

  const subtotal = parseFloat(order.subtotal_amount || 0);
  const discount = parseFloat(order.total_discount_amount || 0);
  const delivery = parseFloat(order.delivery_charge || 0);
  const total = parseFloat(order.total_amount || 0);
  const due = parseFloat(order.due_amount || 0);

  const change = parseFloat(order.change_amount || 0);
  
  let paid = 0;
  if (order.amount_received !== undefined && order.amount_received !== null) {
    paid = parseFloat(order.amount_received);
  } else if (order.paid_amount !== undefined && order.paid_amount !== null) {
    paid = parseFloat(order.paid_amount);
  } else {
    paid = Math.max(0, total - due + change);
  }

  const items = order.items || [];

  const itemsRows = items.map((item) => {
    const itemName = item.product_name || 'Product';
    const variantName = item.variant_name ? ` (${item.variant_name})` : '';
    const itemQty = parseInt(item.quantity || 1, 10);
    const itemPrice = parseFloat(item.price || 0);
    const itemTotal = itemPrice * itemQty;

    return `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px solid #000; text-align: left; vertical-align: top;">
          <div style="font-weight: 600; color: #000;">${itemName}</div>
          ${variantName ? `<div style="font-size: 10px; color: #000; margin-top: 1px;">Option: ${variantName}</div>` : ''}
        </td>
        <td style="padding: 6px 0; border-bottom: 1px solid #000; text-align: center; color: #000; font-family: monospace;">৳${itemPrice.toFixed(2)}</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #000; text-align: center; color: #000; font-family: monospace;">${itemQty}</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #000; text-align: right; font-weight: 600; color: #000; font-family: monospace;">৳${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt #ORD-${orderId}</title>
        <style>
          @media print {
            @page {
              margin: 0;
              size: auto;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              padding: 10px;
            }
          }
          * {
            box-sizing: border-box;
            color: #000000 !important;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #000000;
            margin: 0;
            padding: 20px;
            background-color: #fff;
            line-height: 1.4;
          }
          .receipt-container {
            max-width: 380px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background: #ffffff;
            color: #000000;
          }
          .flex-col {
            display: flex;
            flex-direction: column;
          }
          .store-section {
            align-items: center;
            text-align: center;
            gap: 3px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #000000;
          }
          .store-name {
            font-size: 22px;
            font-weight: 900;
            text-transform: uppercase;
            color: #000000;
            letter-spacing: -0.02em;
          }
          .store-text {
            font-size: 11px;
            color: #000000;
          }
          .branch-badge {
            font-size: 12px;
            font-weight: 700;
            color: #000000;
            margin-top: 4px;
            padding: 3px 10px;
            display: inline-block;
          }
          .section-box {
            gap: 5px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #000000;
            font-size: 12px;
            color: #000000;
          }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #000000;
            margin-bottom: 2px;
          }
          .data-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            font-size: 12px;
            line-height: 1.4;
            color: #000000;
          }
          .data-label {
            color: #000000;
          }
          .data-value {
            font-weight: 600;
            color: #000000;
            text-align: right;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 2px;
            color: #000000;
          }
          .items-table th {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #000000;
            padding: 6px 0;
            border-bottom: 1px solid #000000;
            letter-spacing: 0.03em;
          }
          .items-table td {
            padding: 6px 0;
            border-bottom: 1px solid #000000;
            vertical-align: top;
            color: #000000;
          }
          .prices-box {
            gap: 5px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #000000;
            font-size: 12px;
            color: #000000;
          }
          .price-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
            color: #000000;
            padding: 6px 0;
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
            margin: 4px 0;
          }
          .footer-box {
            align-items: center;
            text-align: center;
            gap: 4px;
            font-size: 11px;
            color: #000000;
            padding-top: 4px;
          }
          .website-url {
            align-items: center;
            text-align: center;
            font-size: 13px;
            font-weight: 800;
            color: #000000;
            letter-spacing: 0.05em;
            padding-top: 8px;
            border-top: 1px solid #000000;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container flex-col">
          
          <!-- 1. Store Info & Branch Name -->
          <div class="store-section flex-col">
            <div class="store-name">${storeName}</div>
            ${storeAddress ? `<div class="store-text">${storeAddress}</div>` : ''}
            <div class="store-text">Phone: ${storePhone} | Email: ${storeEmail}</div>
            <div class="branch-badge">Branch: ${branchName}</div>
          </div>

          <!-- 2. Order & Customer Info -->
          <div class="section-box flex-col">
            <div class="data-row">
              <span class="data-label">Order ID:</span>
              <span class="data-value" style="font-family: monospace; color: #000;">#ORD-${orderId}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Customer Name:</span>
              <span class="data-value" style="color: #000;">${customerName}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Phone Number:</span>
              <span class="data-value" style="color: #000;">${customerPhone}</span>
            </div>
          </div>

          <!-- 4. Product Data -->
          <div class="section-box flex-col">
            <div class="section-title">Items Ordered</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align: left; width: 45%; color: #000;">Product</th>
                  <th style="text-align: center; width: 20%; color: #000;">Price</th>
                  <th style="text-align: center; width: 12%; color: #000;">Qty</th>
                  <th style="text-align: right; width: 23%; color: #000;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <!-- 5. Prices Data -->
          <div class="prices-box flex-col">
            <div class="section-title">Payment Summary</div>
            <div class="data-row">
              <span class="data-label" style="color: #000;">Subtotal:</span>
              <span class="data-value" style="font-family: monospace; color: #000;">৳${subtotal.toFixed(2)}</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="color: #000;">Discount:</span>
              <span class="data-value" style="font-family: monospace; color: #000;">-৳${discount.toFixed(2)}</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="color: #000;">Delivery Charge:</span>
              <span class="data-value" style="font-family: monospace; color: #000;">৳${delivery.toFixed(2)}</span>
            </div>
            <div class="price-total-row">
              <span style="color: #000;">Total Amount:</span>
              <span style="font-family: monospace; color: #000;">৳${total.toFixed(2)}</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="color: #000; font-weight: 700;">Paid Amount:</span>
              <span class="data-value" style="color: #000; font-weight: 700; font-family: monospace;">৳${paid.toFixed(2)}</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="color: #000; font-weight: 700;">Change Amount:</span>
              <span class="data-value" style="color: #000; font-weight: 700; font-family: monospace;">৳${change.toFixed(2)}</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="color: #000; font-weight: 700;">Due Amount:</span>
              <span class="data-value" style="color: #000; font-weight: 700; font-family: monospace;">৳${due.toFixed(2)}</span>
            </div>
          </div>

          <!-- 6. Footer Data -->
          <div class="footer-box flex-col">
            ${order.note ? `<div style="font-style: italic; color: #000; margin-bottom: 4px;">Note: "${order.note}"</div>` : ''}
            <div style="font-weight: 700; color: #000;">Thank you for shopping with us!</div>
            <div style="color: #000;">This is a computer-generated receipt.</div>
          </div>

          <!-- 7. www.disibin.com -->
          <div class="website-url flex-col">
            www.disibin.com
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

