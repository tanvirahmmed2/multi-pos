import toast from 'react-hot-toast';
import { STORE_NAME } from '@/lib/secret';
import { getCurrencySymbol } from '@/lib/currency';

export function printReceipt(order, website) {
  if (!order) return;

  const printWindow = window.open('', '_blank', 'width=450,height=750');
  if (!printWindow) {
    toast.error('Pop-up blocked! Please allow pop-ups to print invoices.');
    return;
  }

  const currencySymbol = getCurrencySymbol(website);

  const storeName = STORE_NAME;
  const storePhone = website?.phone || 'N/A';
  const storeEmail = website?.email || '';
  const storeAddress = website?.address || '';
  const logoUrl = website?.logo || website?.logo_url || null;

  const branchName = order.branch_name || order.branch || website?.branch_name || order.staff_branch || 'Main Branch';

  const orderId = order.order_id || order.id || 'N/A';
  const invoiceNo = order.invoice_no || `ORD-${orderId}`;
  const createdAt = order.created_at ? new Date(order.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const paymentType = (order.payment_type || order.payment_method || 'cod').replace(/_/g, ' ').toUpperCase();
  const paymentStatus = (order.payment_status || (parseFloat(order.due_amount || 0) <= 0 ? 'PAID' : 'UNPAID')).toUpperCase();

  const customerName = order.customer_name || 'Walk-in Customer';
  const customerPhone = order.phone || order.customer_phone || 'N/A';
  const customerAddress = order.shipping_address || '';
  const customerCity = order.shipping_city || '';
  const customerArea = order.shipping_area || '';
  const fullAddress = [customerAddress, customerCity, customerArea].filter(Boolean).join(', ');

  const subtotal = parseFloat(order.subtotal_amount || 0);
  const discount = parseFloat(order.total_discount_amount || order.discount || 0);
  const tax = parseFloat(order.tax_amount || order.tax || 0);
  const delivery = parseFloat(order.delivery_charge || 0);
  const total = parseFloat(order.total_amount || order.total || 0);
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

  const itemsRows = items.map((item, index) => {
    const itemName = item.product_name || item.name || 'Product';
    const variantName = item.variant_name ? ` (${item.variant_name})` : '';
    const itemQty = parseInt(item.quantity || item.qty || 1, 10);
    const itemPrice = parseFloat(item.price || item.unit_price || 0);
    const itemTotal = parseFloat(item.total_price || (itemPrice * itemQty));

    return `
      <tr>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: left; vertical-align: top;">
          <div style="font-weight: 700; color: #000; font-size: 11px; line-height: 1.3;">${index + 1}. ${itemName}</div>
          ${variantName ? `<div style="font-size: 10px; color: #333; margin-top: 1px;">Option: ${variantName}</div>` : ''}
        </td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: center; color: #000; font-family: monospace; font-size: 11px; vertical-align: top;">${itemQty}</td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: right; color: #000; font-family: monospace; font-size: 11px; vertical-align: top;">${currencySymbol}${itemPrice.toFixed(2)}</td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: right; font-weight: 700; color: #000; font-family: monospace; font-size: 11px; vertical-align: top;">${currencySymbol}${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${invoiceNo}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          @media print {
            html, body {
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .receipt-container {
              width: 80mm !important;
              max-width: 80mm !important;
              padding: 4mm 3mm 8mm 3mm !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 auto !important;
            }
          }
          * {
            box-sizing: border-box;
            color: #000000 !important;
          }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, -apple-system, sans-serif;
            color: #000000;
            margin: 0;
            padding: 15px;
            background-color: #f3f4f6;
            line-height: 1.3;
            display: flex;
            justify-content: center;
          }
          .receipt-container {
            width: 80mm;
            max-width: 80mm;
            background: #ffffff;
            padding: 5mm 4mm 8mm 4mm;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .flex-col {
            display: flex;
            flex-direction: column;
          }
          .store-header {
            align-items: center;
            text-align: center;
            gap: 2px;
            padding-bottom: 8px;
            border-bottom: 2px solid #000000;
          }
          .store-logo {
            max-width: 120px;
            max-height: 45px;
            object-fit: contain;
            margin-bottom: 4px;
          }
          .store-name {
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.01em;
          }
          .store-subtext {
            font-size: 10px;
            font-weight: 500;
          }
          .branch-badge {
            font-size: 10px;
            font-weight: 700;
            margin-top: 3px;
            padding: 1px 6px;
            border: 1px solid #000;
            display: inline-block;
            text-transform: uppercase;
          }
          .divider-dashed {
            border-bottom: 1px dashed #000000;
            margin: 2px 0;
          }
          .info-block {
            font-size: 11px;
            gap: 3px;
          }
          .data-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            font-size: 11px;
            line-height: 1.3;
          }
          .data-label {
            font-weight: 600;
          }
          .data-value {
            font-weight: 700;
            text-align: right;
            font-family: monospace;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 2px;
          }
          .items-table th {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 4px 0;
            border-bottom: 1px solid #000000;
            border-top: 1px solid #000000;
          }
          .summary-box {
            font-size: 11px;
            gap: 3px;
            padding-top: 4px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            font-weight: 900;
            padding: 4px 0;
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
            margin: 3px 0;
          }
          .footer-box {
            align-items: center;
            text-align: center;
            gap: 3px;
            font-size: 10px;
            padding-top: 6px;
            border-top: 1px dashed #000000;
          }
          .cut-margin {
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container flex-col">
          
          <!-- 1. Store Header & Logo -->
          <div class="store-header flex-col">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="store-logo" />` : ''}
            <div class="store-name">${storeName}</div>
            ${storeAddress ? `<div class="store-subtext">${storeAddress}</div>` : ''}
            <div class="store-subtext">Phone: ${storePhone} ${storeEmail ? `| Email: ${storeEmail}` : ''}</div>
            <div class="branch-badge">Branch: ${branchName}</div>
          </div>

          <!-- 2. Invoice & Customer Info -->
          <div class="info-block flex-col">
            <div class="data-row">
              <span class="data-label">Invoice No:</span>
              <span class="data-value">${invoiceNo}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Date & Time:</span>
              <span class="data-value">${createdAt}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Payment Type:</span>
              <span class="data-value">${paymentType} (${paymentStatus})</span>
            </div>
            <div class="divider-dashed"></div>
            <div class="data-row">
              <span class="data-label">Customer:</span>
              <span class="data-value" style="font-family: inherit;">${customerName}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Phone:</span>
              <span class="data-value">${customerPhone}</span>
            </div>
            ${fullAddress ? `
            <div class="data-row">
              <span class="data-label">Address:</span>
              <span class="data-value" style="font-family: inherit; font-size: 10px;">${fullAddress}</span>
            </div>
            ` : ''}
          </div>

          <!-- 3. Items Ordered Table -->
          <div class="flex-col">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align: left; width: 45%;">Item Description</th>
                  <th style="text-align: center; width: 12%;">Qty</th>
                  <th style="text-align: right; width: 21%;">Price</th>
                  <th style="text-align: right; width: 22%;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <!-- 4. Payment & Totals Summary -->
          <div class="summary-box flex-col">
            <div class="data-row">
              <span class="data-label">Subtotal:</span>
              <span class="data-value">${currencySymbol}${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
            <div class="data-row">
              <span class="data-label">Discount:</span>
              <span class="data-value">-${currencySymbol}${discount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${tax > 0 ? `
            <div class="data-row">
              <span class="data-label">Tax:</span>
              <span class="data-value">${currencySymbol}${tax.toFixed(2)}</span>
            </div>
            ` : ''}
            ${delivery > 0 ? `
            <div class="data-row">
              <span class="data-label">Delivery Charge:</span>
              <span class="data-value">${currencySymbol}${delivery.toFixed(2)}</span>
            </div>
            ` : ''}
            
            <div class="total-row">
              <span>TOTAL AMOUNT:</span>
              <span>${currencySymbol}${total.toFixed(2)}</span>
            </div>

            <div class="data-row">
              <span class="data-label">Paid Amount:</span>
              <span class="data-value">${currencySymbol}${paid.toFixed(2)}</span>
            </div>
            ${change > 0 ? `
            <div class="data-row">
              <span class="data-label">Change Amount:</span>
              <span class="data-value">${currencySymbol}${change.toFixed(2)}</span>
            </div>
            ` : ''}
            ${due > 0 ? `
            <div class="data-row" style="font-weight: 800;">
              <span class="data-label">Due Balance:</span>
              <span class="data-value" style="color: #000;">${currencySymbol}${due.toFixed(2)}</span>
            </div>
            ` : ''}
          </div>

          <!-- 5. Receipt Footer -->
          <div class="footer-box flex-col">
            ${order.note ? `<div style="font-style: italic; margin-bottom: 2px;">Note: "${order.note}"</div>` : ''}
            <div style="font-weight: 700; text-transform: uppercase;">Thank you for shopping with us!</div>
            <div>Computer generated POS thermal receipt</div>
            <div style="font-weight: 800; font-size: 11px; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">www.disibin.com</div>
          </div>

          <div class="cut-margin"></div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 600);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
