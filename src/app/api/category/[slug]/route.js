import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Helper to find category by either integer ID or slug string
async function getCategoryByIdOrSlug(idOrSlug) {
  const isNumeric = /^\d+$/.test(idOrSlug);
  const sql = isNumeric 
    ? 'SELECT * FROM categories WHERE category_id = $1' 
    : 'SELECT * FROM categories WHERE slug = $1';
  const param = isNumeric ? parseInt(idOrSlug, 10) : idOrSlug;
  const res = await query(sql, [param]);
  return res.rows[0];
}

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const category = await getCategoryByIdOrSlug(slug);
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }
    return Response.json(category, { status: 200 });
  } catch (error) {
    console.error('Error fetching category:', error);
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
    const category = await getCategoryByIdOrSlug(paramSlug);
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const name = formData.get('name');
    const parentIdVal = formData.get('parent_id');
    const imageFile = formData.get('image');

    if (!name) {
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = slugify(name);
    const parent_id = parentIdVal && parentIdVal !== 'null' && parentIdVal !== '' ? parseInt(parentIdVal, 10) : null;

    // Prevent cyclic relationship (category cannot be its own parent)
    if (parent_id && parent_id === category.category_id) {
      return Response.json({ error: 'A category cannot be its own parent' }, { status: 400 });
    }

    let imageUrl = category.image;
    let imageId = category.image_id;

    // If new image file is uploaded
    if (imageFile && typeof imageFile !== 'string') {
      const uploadResult = await uploadToCloudinary(imageFile, 'categories');
      if (uploadResult) {
        // Delete previous image from Cloudinary
        if (category.image_id) {
          await deleteFromCloudinary(category.image_id);
        }
        imageUrl = uploadResult.url;
        imageId = uploadResult.id;
      }
    }

    const result = await query(
      `UPDATE categories 
       SET name = $1, slug = $2, parent_id = $3, image = $4, image_id = $5 
       WHERE category_id = $6 
       RETURNING *`,
      [name, slug, parent_id, imageUrl, imageId, category.category_id]
    );

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error updating category:', error);
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
    const category = await getCategoryByIdOrSlug(paramSlug);
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete image from Cloudinary
    if (category.image_id) {
      try {
        await deleteFromCloudinary(category.image_id);
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err);
      }
    }

    // Delete category from DB
    await query('DELETE FROM categories WHERE category_id = $1', [category.category_id]);

    return Response.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
