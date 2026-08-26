import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { generateUniqueBarcode } from '@/lib/barcode';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function GET(req) {
  try {
    let sql = `
      SELECT DISTINCT ON (p.product_id)
        p.product_id, p.category_id, p.brand_id, p.name, p.slug, p.description, p.is_active, p.created_at, p.updated_at,
        c.name AS category_name, b.name AS brand_name,
        v.variant_id, v.variant_name, v.barcode, v.purchase_price, v.sale_price,

        v.discount_price, v.wholesale_price, v.dealer_price, v.retail_price,
        v.stock, v.image, v.image_id, v.weight, v.unit,
        COALESCE((SELECT SUM(stock)::integer FROM product_variants WHERE product_id = p.product_id), 0) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN product_variants v ON p.product_id = v.product_id
    `;
    let params = [];
    let whereClauses = [];

    const url = new URL(req.url);
    const category = url.searchParams.get('category');

    if (category) {
      const isNumeric = /^\d+$/.test(category);
      const catRes = await query(
        isNumeric 
          ? 'SELECT category_id FROM categories WHERE category_id = $1' 
          : 'SELECT category_id FROM categories WHERE slug = $1',
        [isNumeric ? parseInt(category, 10) : category]
      );
      
      if (catRes.rows.length > 0) {
        const targetId = catRes.rows[0].category_id;
        const subcatsRes = await query(
          'SELECT category_id FROM categories WHERE parent_id = $1 OR category_id = $1',
          [targetId]
        );
        const categoryIds = subcatsRes.rows.map(r => r.category_id);
        
        whereClauses.push(`p.category_id = ANY($${params.length + 1}::int[])`);
        params.push(categoryIds);
      } else {
        whereClauses.push(`1=0`);
      }
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY p.product_id DESC, v.variant_id ASC`;
    const result = await query(sql, params);
    
    // For simple integration, return stock mapped to total_stock
    const mappedRows = result.rows.map(r => ({
      ...r,
      stock: r.total_stock
    }));

    return Response.json(mappedRows, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name');
    const description = formData.get('description') || '';
    const category_id = formData.get('category_id') ? parseInt(formData.get('category_id'), 10) : null;
    const brand_id = formData.get('brand_id') ? parseInt(formData.get('brand_id'), 10) : null;
    
    if (!name) {
      return Response.json({ error: 'Product name is required' }, { status: 400 });
    }

    const purchase_price = formData.get('purchase_price') ? parseFloat(formData.get('purchase_price')) : 0;
    const sale_price = formData.get('sale_price') ? parseFloat(formData.get('sale_price')) : 0;
    const discount_price = formData.get('discount_price') ? parseFloat(formData.get('discount_price')) : 0;
    const wholesale_price = formData.get('wholesale_price') ? parseFloat(formData.get('wholesale_price')) : 0;
    const dealer_price = formData.get('dealer_price') ? parseFloat(formData.get('dealer_price')) : 0;
    const retail_price = formData.get('retail_price') ? parseFloat(formData.get('retail_price')) : 0;

    const unit = formData.get('unit') || 'Pcs';
    let barcode = formData.get('barcode') || '';
    const stock = formData.get('stock') ? parseInt(formData.get('stock'), 10) : 0;
    const variantsStr = formData.get('variants');

    let variants = [];
    if (variantsStr) {
      try {
        variants = JSON.parse(variantsStr);
      } catch (err) {
        return Response.json({ error: 'Invalid variants JSON format' }, { status: 400 });
      }
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      if (!sale_price || !purchase_price) {
        return Response.json({ error: 'At least one variant or primary pricing details are required' }, { status: 400 });
      }
      variants = [{
        variant_name: 'Default',
        barcode: barcode || null,
        purchase_price,
        sale_price,
        discount_price,
        wholesale_price,
        dealer_price,
        retail_price,
        stock,
        unit
      }];
    }

    // Pre-populate barcodes and validate uniqueness
    let lastGeneratedBarcode = null;
    for (const variant of variants) {
      if (!variant.barcode) {
        if (lastGeneratedBarcode) {
          const nextBarcode = (parseInt(lastGeneratedBarcode, 10) + 1).toString();
          variant.barcode = nextBarcode;
          lastGeneratedBarcode = nextBarcode;
        } else {
          const generated = await generateUniqueBarcode();
          variant.barcode = generated;
          lastGeneratedBarcode = generated;
        }
      } else {
        const checkBarcode = await query('SELECT variant_id FROM product_variants WHERE barcode = $1', [variant.barcode]);
        if (checkBarcode.rows.length > 0) {
          return Response.json({ error: `Barcode '${variant.barcode}' already exists. It must be unique.` }, { status: 400 });
        }
      }
    }

    const slug = slugify(name) + '-' + Math.floor(1000 + Math.random() * 9000);
    const is_active = formData.get('is_active') === 'false' ? false : true;

    // Begin DB transaction
    await query('BEGIN');

    // Insert Product into Database
    const productResult = await query(
      `INSERT INTO products (
        category_id, brand_id, name, slug, description, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [category_id, brand_id, name, slug, description, is_active]
    );

    const product = productResult.rows[0];

    // Insert all variants
    let index = 0;
    let firstVariantInserted = null;
    for (const variant of variants) {
      const vName = variant.variant_name || 'Default';
      const vBarcode = variant.barcode || await generateUniqueBarcode();
      const vPurchasePrice = parseFloat(variant.purchase_price) || 0;
      const vSalePrice = parseFloat(variant.sale_price) || 0;
      const vDiscountPrice = parseFloat(variant.discount_price) || 0;
      const vWholesalePrice = parseFloat(variant.wholesale_price) || 0;
      const vDealerPrice = parseFloat(variant.dealer_price) || 0;
      const vRetailPrice = parseFloat(variant.retail_price) || 0;
      const vStock = parseInt(variant.stock, 10) || 0;
      const vUnit = variant.unit || unit || 'Pcs';
      const vWeight = (variant.weight !== undefined && variant.weight !== null && variant.weight !== '') ? parseFloat(variant.weight) : null;
      const vIsActive = variant.is_active !== false;

      let vImage = null;
      let vImageId = null;

      // Check if there is a variant-specific image uploaded
      const varImageFile = formData.get(`variant_image_${index}`);
      if (varImageFile && typeof varImageFile !== 'string') {
        const varUploadResult = await uploadToCloudinary(varImageFile, 'products');
        if (varUploadResult) {
          vImage = varUploadResult.url;
          vImageId = varUploadResult.id;
        }
      }

      const insertedVariant = await query(
        `INSERT INTO product_variants (
          product_id, variant_name, barcode, purchase_price, sale_price, 
          discount_price, wholesale_price, dealer_price, retail_price, stock, weight, unit, image, image_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          product.product_id, vName, vBarcode, vPurchasePrice, vSalePrice,
          vDiscountPrice, vWholesalePrice, vDealerPrice, vRetailPrice, vStock, vWeight, vUnit, vImage, vImageId, vIsActive
        ]
      );

      if (index === 0) {
        firstVariantInserted = insertedVariant.rows[0];
      }
      index++;
    }

    await query('COMMIT');

    const firstVar = firstVariantInserted || variants[0];
    return Response.json({
      ...product,
      purchase_price: firstVar.purchase_price,
      sale_price: firstVar.sale_price,
      discount_price: firstVar.discount_price || 0,
      wholesale_price: firstVar.wholesale_price || 0,
      dealer_price: firstVar.dealer_price || 0,
      retail_price: firstVar.retail_price || 0,
      unit: firstVar.unit || 'Pcs',
      barcode: firstVar.barcode,
      stock: firstVar.stock,
      image: firstVar.image || null,
      image_id: firstVar.image_id || null
    }, { status: 201 });


  } catch (error) {
    await query('ROLLBACK');
    console.error('Error creating product:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
