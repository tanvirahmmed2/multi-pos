import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function GET(req) {
  try {
    const result = await query('SELECT * FROM brands ORDER BY brand_id ASC');
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching brands:', error);
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
    const isActiveVal = formData.get('is_active');
    const imageFile = formData.get('image');

    if (!name) {
      return Response.json({ error: 'Brand name is required' }, { status: 400 });
    }
    if (!imageFile) {
      return Response.json({ error: 'Brand logo image is required' }, { status: 400 });
    }

    const is_active = isActiveVal === 'false' ? false : true;

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(imageFile, 'brands');
    if (!uploadResult) {
      return Response.json({ error: 'Failed to upload logo image' }, { status: 500 });
    }

    const result = await query(
      `INSERT INTO brands (name, description, is_active, image, image_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, is_active, uploadResult.url, uploadResult.id]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
