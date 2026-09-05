import toast from 'react-hot-toast';
import { STORE_NAME } from '@/lib/secret';
import { getCurrencySymbol } from '@/lib/currency';

export function printPriceTags(tagItems, website) {
  if (!tagItems || !Array.isArray(tagItems) || tagItems.length === 0) {
    toast.error('No products selected for price tags.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=500,height=750');
  if (!printWindow) {
    toast.error('Pop-up blocked! Please allow pop-ups to print price tags.');
    return;
  }

  const currencySymbol = getCurrencySymbol(website);
  const storeName = STORE_NAME || website?.hero_title || 'STORE';

  const tagsToPrint = [];
  tagItems.forEach((item) => {
    const qty = parseInt(item.quantity || item.qty || 1, 10);
    for (let i = 0; i < qty; i++) {
      tagsToPrint.push({
        productName: item.product_name || item.name || 'Product',
        variantName: item.variant_name || item.variant || '',
        price: parseFloat(item.price || item.sale_price || 0),
        barcode: item.barcode || item.code || item.sku || `PROD-${item.product_id || item.id || '101'}`
      });
    }
  });

  const tagsHTML = tagsToPrint.map((tag, idx) => {
    const barcodeId = `barcode-${idx}`;
    const fullProductName = tag.productName + (tag.variantName ? ` (${tag.variantName})` : '');

    return `
      <div class="tag-card flex-col">
        <div class="store-title">${storeName}</div>
        <div class="product-title">${fullProductName}</div>
        <div class="price-display">${currencySymbol}${tag.price.toFixed(2)}</div>
        <div class="barcode-container">
          <svg id="${barcodeId}" class="barcode-svg"></svg>
        </div>
        <div class="website-footer">www.disibin.com</div>
      </div>
    `;
  }).join('');

  const barcodeInitScripts = tagsToPrint.map((tag, idx) => {
    const safeBarcode = String(tag.barcode).replace(/"/g, '\\"');
    return `
      try {
        JsBarcode("#barcode-${idx}", "${safeBarcode}", {
          format: "CODE128",
          width: 1.8,
          height: 38,
          displayValue: true,
          fontSize: 10,
          fontOptions: "bold",
          margin: 6,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch(e) {
        console.error('Barcode error for ${safeBarcode}:', e);
      }
    `;
  }).join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Product Price Tags (${tagsToPrint.length})</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 3.75in 1.875in;
            margin: 0;
          }
          @media print {
            html, body {
              width: 3.75in !important;
              height: 1.875in !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .tag-card {
              page-break-after: always;
              break-after: page;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
            }
          }
          * {
            box-sizing: border-box;
            color: #000000 !important;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
          }
          .flex-col {
            display: flex;
            flex-direction: column;
          }
          .tag-card {
            width: 3.75in;
            height: 1.875in;
            background: #ffffff;
            padding: 0.08in 0.1in;
            border: 1px dashed #94a3b8;
            align-items: center;
            justify-content: space-between;
            text-align: center;
            box-sizing: border-box;
            overflow: hidden;
          }
          .store-title {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .product-title {
            font-size: 10px;
            font-weight: 700;
            line-height: 1.2;
            max-height: 2.4em;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            word-break: break-word;
            margin: 1px 0;
          }
          .price-display {
            font-size: 15px;
            font-weight: 900;
            font-family: 'Courier New', Courier, monospace;
            line-height: 1;
            letter-spacing: -0.02em;
          }
          .barcode-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            background: #ffffff;
            padding: 2px 0;
            max-height: 0.65in;
            overflow: hidden;
          }
          .barcode-svg {
            max-width: 100%;
            height: auto;
            max-height: 0.6in;
            background: #ffffff;
          }
          .website-footer {
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.06em;
            line-height: 1;
            border-top: 1px solid #000000;
            padding-top: 2px;
            width: 100%;
            text-align: center;
          }
        </style>
      </head>
      <body>
        ${tagsHTML}

        <script>
          window.onload = function() {
            ${barcodeInitScripts}
            setTimeout(function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 600);
            }, 350);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
