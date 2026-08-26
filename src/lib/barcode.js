import { query } from './db';

/**
 * Generates a unique barcode for a product.
 * Finds the highest numeric barcode in the database that is >= 1000,
 * and returns the next sequential number. If none exists, starts at 1000.
 */
export async function generateUniqueBarcode() {
  const sql = `
    SELECT barcode 
    FROM product_variants 
    WHERE barcode ~ '^[0-9]+$'
  `;
  const result = await query(sql);
  
  let maxBarcodeNum = 999; // Generating starts from 1000
  for (const row of result.rows) {
    const num = parseInt(row.barcode, 10);
    if (!isNaN(num) && num > maxBarcodeNum) {
      maxBarcodeNum = num;
    }
  }
  
  return (maxBarcodeNum + 1).toString();
}
