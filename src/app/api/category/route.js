import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

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
    const result = await query(`
      SELECT c.*, p.name AS parent_name 
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.category_id
      ORDER BY c.parent_id NULLS FIRST, c.category_id ASC
    `);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
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
    const parentIdVal = formData.get('parent_id');
    const imageFile = formData.get('image');

    if (!name) {
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }
    if (!imageFile) {
      return Response.json({ error: 'Category image is required' }, { status: 400 });
    }

    const slug = slugify(name);
    const parent_id = parentIdVal && parentIdVal !== 'null' && parentIdVal !== '' ? parseInt(parentIdVal, 10) : null;

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(imageFile, 'categories');
    if (!uploadResult) {
      return Response.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const result = await query(
      `INSERT INTO categories (name, slug, parent_id, image, image_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, slug, parent_id, uploadResult.url, uploadResult.id]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
