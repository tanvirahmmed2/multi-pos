import { query } from '@/lib/db';

export async function GET(req) {
  try {
    // 1. Fetch website settings
    const settingsRes = await query('SELECT * FROM websites ORDER BY website_id ASC LIMIT 1');
    const settings = settingsRes.rows[0] || {};

    // 2. Fetch top 4 best-selling / popular products
    const popularRes = await query(`
      WITH ranked_products AS (
        SELECT 
          p.product_id, p.category_id, p.brand_id, p.name, p.slug, p.description, p.is_active, p.created_at, p.updated_at,
          c.name AS category_name, b.name AS brand_name,
          v.variant_id, v.variant_name, v.barcode, v.purchase_price, v.sale_price,
          v.discount_price, v.wholesale_price, v.dealer_price, v.retail_price,
          v.stock, v.image, v.image_id, v.weight, v.unit,
          ROW_NUMBER() OVER (PARTITION BY p.product_id ORDER BY v.variant_id ASC) as rn,
          COALESCE((SELECT SUM(stock)::integer FROM product_variants WHERE product_id = p.product_id), 0) AS total_stock,
          COALESCE(sales.sold_qty, 0) AS sold_qty
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN brands b ON p.brand_id = b.brand_id
        LEFT JOIN product_variants v ON p.product_id = v.product_id
        LEFT JOIN (
          SELECT product_id, SUM(quantity)::integer AS sold_qty
          FROM order_items
          GROUP BY product_id
        ) sales ON p.product_id = sales.product_id
        WHERE p.is_active != false AND v.image IS NOT NULL
      )
      SELECT * FROM ranked_products
      WHERE rn = 1
      ORDER BY sold_qty DESC, total_stock DESC, product_id DESC
      LIMIT 4
    `);
    const products = popularRes.rows;

    return Response.json({
      settings,
      products
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching clean hero products:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
