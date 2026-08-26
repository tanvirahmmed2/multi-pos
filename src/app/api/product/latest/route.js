import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const result = await query(`
      SELECT DISTINCT ON (p.product_id)
        p.product_id, p.category_id, p.brand_id, p.name, p.slug, p.description, p.is_active, p.created_at, p.updated_at,
        c.name AS category_name, b.name AS brand_name,
        v.variant_id, v.variant_name, v.barcode, v.purchase_price, v.sale_price,
        v.discount_price, v.wholesale_price, v.dealer_price, v.retail_price,
        v.stock, v.image, v.image_id, v.weight, v.unit
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN product_variants v ON p.product_id = v.product_id
      ORDER BY p.product_id DESC, v.variant_id ASC
      LIMIT 10
    `);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching latest products:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
