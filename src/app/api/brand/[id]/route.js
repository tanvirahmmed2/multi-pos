import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const result = await query('SELECT * FROM brands WHERE brand_id = $1', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Brand not found' }, { status: 404 });
    }
    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const getBrand = await query('SELECT * FROM brands WHERE brand_id = $1', [id]);
    if (getBrand.rows.length === 0) {
      return Response.json({ error: 'Brand not found' }, { status: 404 });
    }
    const brand = getBrand.rows[0];

    const formData = await req.formData();
    const name = formData.get('name');
    const description = formData.get('description') || '';
    const isActiveVal = formData.get('is_active');
    const imageFile = formData.get('image');

    if (!name) {
      return Response.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const is_active = isActiveVal === 'false' ? false : true;

    let imageUrl = brand.image;
    let imageId = brand.image_id;

    // Check if new image is uploaded
    if (imageFile && typeof imageFile !== 'string') {
      const uploadResult = await uploadToCloudinary(imageFile, 'brands');
      if (uploadResult) {
        // Delete previous image from Cloudinary
        if (brand.image_id) {
          await deleteFromCloudinary(brand.image_id);
        }
        imageUrl = uploadResult.url;
        imageId = uploadResult.id;
      }
    }

    const result = await query(
      `UPDATE brands 
       SET name = $1, description = $2, is_active = $3, image = $4, image_id = $5 
       WHERE brand_id = $6 
       RETURNING *`,
      [name, description, is_active, imageUrl, imageId, id]
    );

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error updating brand:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const getBrand = await query('SELECT * FROM brands WHERE brand_id = $1', [id]);
    if (getBrand.rows.length === 0) {
      return Response.json({ error: 'Brand not found' }, { status: 404 });
    }
    const brand = getBrand.rows[0];

    // Delete image from Cloudinary
    if (brand.image_id) {
      try {
        await deleteFromCloudinary(brand.image_id);
      } catch (err) {
        console.error('Failed to delete brand logo from Cloudinary:', err);
      }
    }

    // Delete brand from DB
    await query('DELETE FROM brands WHERE brand_id = $1', [id]);

    return Response.json({ message: 'Brand deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
