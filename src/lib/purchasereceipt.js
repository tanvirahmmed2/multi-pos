import toast from 'react-hot-toast';
import { STORE_NAME } from '@/lib/secret';
import { getCurrencySymbol } from '@/lib/currency';

export function printPurchaseReceipt(purchase, website) {
  if (!purchase || typeof window === 'undefined') return;

  const currencySymbol = getCurrencySymbol(website);

  const storeName = STORE_NAME;
  const storePhone = website?.phone || 'N/A';
  const storeEmail = website?.email || '';
  const storeAddress = website?.address || '';
  const logoUrl = website?.logo || website?.logo_url || null;

  const branchName = purchase.branch_name ? `${purchase.branch_name}${purchase.branch_code ? ` (${purchase.branch_code})` : ''}` : 'Main Branch';
  const purchaseId = purchase.purchase_id || 'N/A';
  const invoiceNo = purchase.invoice_no ? `#${purchase.invoice_no}` : `INV-PR-${purchaseId}`;
  const createdAt = purchase.created_at ? new Date(purchase.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const due = parseFloat(purchase.due_amount || 0);
  const total = parseFloat(purchase.total_amount || 0);
  const paid = parseFloat(purchase.total_paid || 0);
  const subtotal = parseFloat(purchase.subtotal_amount || 0);
  const extraDiscount = parseFloat(purchase.extra_discount || 0);

  const isPaid = due <= 0 || purchase.is_paid;
  const paymentStatus = isPaid ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
  const stockStatus = purchase.stock_added ? 'STOCK INGESTED' : 'STOCK NOT ADDED';

  const supplierName = purchase.supplier_name || 'Walk-in Supplier';
  const supplierPhone = purchase.supplier_phone || 'N/A';
  const staffName = purchase.staff_name ? `${purchase.staff_name} (${purchase.staff_role || 'Staff'})` : 'System Administrator';

  const items = purchase.items || [];
  const itemsRows = items.map((item, index) => {
    const itemName = item.product_name || 'Product';
    const variantName = item.variant_name ? ` (${item.variant_name})` : '';
    const itemQty = parseInt(item.quantity || 1, 10);
    const itemPrice = parseFloat(item.purchase_price || 0);
    const itemTotal = itemQty * itemPrice;

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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Purchase Receipt - ${invoiceNo}</title>
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

          <!-- 2. Invoice & Purchase Info -->
          <div class="info-block flex-col">
            <div class="data-row">
              <span class="data-label">Invoice / PR No:</span>
              <span class="data-value">${invoiceNo}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Date & Time:</span>
              <span class="data-value">${createdAt}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Payment Status:</span>
              <span class="data-value">${paymentStatus}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Inventory Status:</span>
              <span class="data-value">${stockStatus}</span>
            </div>
            <div class="divider-dashed"></div>
            <div class="data-row">
              <span class="data-label">Supplier:</span>
              <span class="data-value" style="font-family: inherit;">${supplierName}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Supplier Phone:</span>
              <span class="data-value">${supplierPhone}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Processed By:</span>
              <span class="data-value" style="font-family: inherit; font-size: 10px;">${staffName}</span>
            </div>
          </div>

          <!-- 3. Line Items Table -->
          <div class="flex-col">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align: left; width: 45%;">Item Asset</th>
                  <th style="text-align: center; width: 12%;">Qty</th>
                  <th style="text-align: right; width: 21%;">Cost</th>
                  <th style="text-align: right; width: 22%;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <!-- 4. Totals Summary -->
          <div class="summary-box flex-col">
            <div class="data-row">
              <span class="data-label">Subtotal:</span>
              <span class="data-value">${currencySymbol}${subtotal.toFixed(2)}</span>
            </div>
            ${extraDiscount > 0 ? `
            <div class="data-row">
              <span class="data-label">Discount:</span>
              <span class="data-value">-${currencySymbol}${extraDiscount.toFixed(2)}</span>
            </div>
            ` : ''}
            
            <div class="total-row">
              <span>TOTAL INVOICE:</span>
              <span>${currencySymbol}${total.toFixed(2)}</span>
            </div>

            <div class="data-row">
              <span class="data-label">Amount Paid:</span>
              <span class="data-value">${currencySymbol}${paid.toFixed(2)}</span>
            </div>
            ${due > 0 ? `
            <div class="data-row" style="font-weight: 800;">
              <span class="data-label">Due Balance:</span>
              <span class="data-value" style="color: #000;">${currencySymbol}${due.toFixed(2)}</span>
            </div>
            ` : ''}
          </div>

          <!-- 5. Receipt Footer -->
          <div class="footer-box flex-col">
            ${purchase.note ? `<div style="font-style: italic; margin-bottom: 2px;">Note: "${purchase.note}"</div>` : ''}
            <div style="font-weight: 700; text-transform: uppercase;">Procurement Stock Ingestion Receipt</div>
            <div>Computer generated POS purchase receipt</div>
          </div>

          <div style="margin-bottom: 15px;"></div>
        </div>
      </body>
    </html>
  `;

  let iframe = document.getElementById('purchase-print-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'purchase-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const iframeWin = iframe.contentWindow || iframe.contentDocument.defaultView;
  const doc = iframeWin.document;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    iframeWin.focus();
    iframeWin.print();
  }, 250);
}
