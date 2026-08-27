import { query } from './db';

export async function generateUniqueBarcode() {
  const sql = `
    SELECT barcode 
    FROM product_variants 
    WHERE barcode ~ '^[0-9]+$'
  `;
  const result = await query(sql);
  
  let maxBarcodeNum = 999; 
  for (const row of result.rows) {
    const num = parseInt(row.barcode, 10);
    if (!isNaN(num) && num > maxBarcodeNum) {
      maxBarcodeNum = num;
    }
  }
  
  return (maxBarcodeNum + 1).toString();
}
