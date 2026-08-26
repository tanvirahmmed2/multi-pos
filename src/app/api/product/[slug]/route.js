import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
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

async function getProductByIdOrSlug(idOrSlug) {
  const isNumeric = /^\d+$/.test(idOrSlug);
  const sql = isNumeric 
    ? `SELECT p.*,
              v.variant_id, v.variant_name, v.barcode, v.purchase_price, v.sale_price,
              v.discount_price, v.wholesale_price, v.dealer_price, v.retail_price, v.stock, v.image, v.image_id, v.weight, v.unit
       FROM products p 
       LEFT JOIN product_variants v ON p.product_id = v.product_id
       WHERE p.product_id = $1
       ORDER BY v.variant_id ASC LIMIT 1`
    : `SELECT p.*,
              v.variant_id, v.variant_name, v.barcode, v.purchase_price, v.sale_price,
              v.discount_price, v.wholesale_price, v.dealer_price, v.retail_price, v.stock, v.image, v.image_id, v.weight, v.unit
       FROM products p 
       LEFT JOIN product_variants v ON p.product_id = v.product_id
       WHERE p.slug = $1
       ORDER BY v.variant_id ASC LIMIT 1`;
  const param = isNumeric ? parseInt(idOrSlug, 10) : idOrSlug;
  const res = await query(sql, [param]);
  return res.rows[0];
}

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const product = await getProductByIdOrSlug(slug);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch its variants
    const variantsRes = await query(
      'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY variant_id ASC',
      [product.product_id]
    );

    return Response.json({
      ...product,
      variants: variantsRes.rows
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { slug: paramSlug } = await params;
    const product = await getProductByIdOrSlug(paramSlug);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
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
    const variantsStr = formData.get('variants'); // JSON string array

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

    // Pre-populate barcodes and validate barcode uniqueness against OTHER products
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
        const checkBarcode = await query(
          'SELECT variant_id FROM product_variants WHERE barcode = $1 AND product_id != $2',
          [variant.barcode, product.product_id]
        );
        if (checkBarcode.rows.length > 0) {
          return Response.json({ error: `Barcode '${variant.barcode}' already exists on another product. It must be unique.` }, { status: 400 });
        }
      }
    }

    const isActiveVal = formData.get('is_active');
    const slug = slugify(name) + '-' + product.product_id;
    const is_active = isActiveVal === 'false' ? false : true;

    // Begin DB transaction
    await query('BEGIN');

    // Update Product details
    const updateResult = await query(
      `UPDATE products 
       SET category_id = $1, brand_id = $2, name = $3, slug = $4, description = $5, is_active = $6, updated_at = NOW()
       WHERE product_id = $7 
       RETURNING *`,
      [
        category_id, brand_id, name, slug, description, is_active,
        product.product_id
      ]
    );

    const updatedProduct = updateResult.rows[0];

    // Get list of existing variant IDs in DB
    const existingVariantsRes = await query(
      'SELECT variant_id FROM product_variants WHERE product_id = $1',
      [product.product_id]
    );
    const existingIds = existingVariantsRes.rows.map(r => r.variant_id);

    const incomingIds = variants.map(v => v.variant_id).filter(id => id !== undefined && id !== null);

    // Delete variants that are no longer present
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (idsToDelete.length > 0) {
      // Fetch image_ids of variants to be deleted so we can clean them up in Cloudinary
      const varsToDeleteRes = await query(
        'SELECT image_id, variant_id FROM product_variants WHERE variant_id = ANY($1::int[])',
        [idsToDelete]
      );

      // Perform DB delete
      await query(
        'DELETE FROM product_variants WHERE variant_id = ANY($1::int[])',
        [idsToDelete]
      );

      // Clean up Cloudinary images if they are variant-specific and not used elsewhere
      for (const row of varsToDeleteRes.rows) {
        if (row.image_id) {
          const checkUsage = await query('SELECT count(*)::int as count FROM product_variants WHERE image_id = $1', [row.image_id]);
          if (checkUsage.rows[0].count === 0) {
            await deleteFromCloudinary(row.image_id);
          }
        }
      }
    }

    // Insert or update incoming variants
    let index = 0;
    for (const variant of variants) {
      const vName = variant.variant_name || 'Default';
      const vBarcode = variant.barcode;
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
      
      let vImage = variant.image || null;
      let vImageId = variant.image_id || null;

      // Check if there is a new image file uploaded for this variant index
      const varImageFile = formData.get(`variant_image_${index}`);
      if (varImageFile && typeof varImageFile !== 'string') {
        const varUploadResult = await uploadToCloudinary(varImageFile, 'products');
        if (varUploadResult) {
          // If we had a variant-specific image before, delete it if it is not used elsewhere
          if (variant.image_id) {
            const checkUsage = await query('SELECT count(*)::int as count FROM product_variants WHERE image_id = $1 AND variant_id != $2', [variant.image_id, variant.variant_id || 0]);
            if (checkUsage.rows[0].count === 0) {
              await deleteFromCloudinary(variant.image_id);
            }
          }
          vImage = varUploadResult.url;
          vImageId = varUploadResult.id;
        }
      }

      if (variant.variant_id) {
        // Update existing variant
        await query(
          `UPDATE product_variants 
           SET variant_name = $1, barcode = $2, purchase_price = $3, sale_price = $4, 
               discount_price = $5, wholesale_price = $6, dealer_price = $7, retail_price = $8, 
               stock = $9, weight = $10, unit = $11, image = $12, image_id = $13, is_active = $14, updated_at = NOW()
           WHERE variant_id = $15`,
          [
            vName, vBarcode, vPurchasePrice, vSalePrice,
            vDiscountPrice, vWholesalePrice, vDealerPrice, vRetailPrice, vStock, vWeight, vUnit, vImage, vImageId, vIsActive,
            variant.variant_id
          ]
        );
      } else {
        // Insert new variant
        await query(
          `INSERT INTO product_variants (
            product_id, variant_name, barcode, purchase_price, sale_price, 
            discount_price, wholesale_price, dealer_price, retail_price, stock, weight, unit, image, image_id, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            product.product_id, vName, vBarcode, vPurchasePrice, vSalePrice,
            vDiscountPrice, vWholesalePrice, vDealerPrice, vRetailPrice, vStock, vWeight, vUnit, vImage, vImageId, vIsActive
          ]
        );
      }
      index++;
    }

    await query('COMMIT');

    const finalFirstVarRes = await query(
      `SELECT image, image_id, purchase_price, sale_price, discount_price, wholesale_price, dealer_price, retail_price, unit, barcode, stock 
       FROM product_variants 
       WHERE product_id = $1 
       ORDER BY variant_id ASC LIMIT 1`,
      [product.product_id]
    );
    const finalFirstVar = finalFirstVarRes.rows[0] || {};

    return Response.json({
      ...updatedProduct,
      purchase_price: finalFirstVar.purchase_price,
      sale_price: finalFirstVar.sale_price,
      discount_price: finalFirstVar.discount_price || 0,
      wholesale_price: finalFirstVar.wholesale_price || 0,
      dealer_price: finalFirstVar.dealer_price || 0,
      retail_price: finalFirstVar.retail_price || 0,
      unit: finalFirstVar.unit || 'Pcs',
      barcode: finalFirstVar.barcode,
      stock: finalFirstVar.stock,
      image: finalFirstVar.image || null,
      image_id: finalFirstVar.image_id || null
    }, { status: 200 });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error updating product:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



export async function DELETE(req, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { slug: paramSlug } = await params;
    const product = await getProductByIdOrSlug(paramSlug);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch all variants to delete their images from Cloudinary
    const variantsRes = await query('SELECT image_id FROM product_variants WHERE product_id = $1', [product.product_id]);
    for (const v of variantsRes.rows) {
      if (v.image_id) {
        try {
          await deleteFromCloudinary(v.image_id);
        } catch (err) {
          console.error('Failed to delete variant image from Cloudinary:', err);
        }
      }
    }

    // Delete product from DB (variants will cascade delete)
    await query('DELETE FROM products WHERE product_id = $1', [product.product_id]);

    return Response.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
