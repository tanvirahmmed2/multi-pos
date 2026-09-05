import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const formData = await req.formData();
    const logoFile = formData.get('logo');

    if (!logoFile || typeof logoFile === 'string' || !logoFile.name) {
      return Response.json({ error: 'No valid image file provided' }, { status: 400 });
    }

    const checkRes = await query('SELECT * FROM websites ORDER BY website_id ASC LIMIT 1');
    const existing = checkRes.rows.length > 0 ? checkRes.rows[0] : null;

    const uploadResult = await uploadToCloudinary(logoFile, 'settings');
    if (!uploadResult) {
      return Response.json({ error: 'Failed to upload image to Cloudinary' }, { status: 500 });
    }

    if (existing && existing.logo_id) {
      try {
        await deleteFromCloudinary(existing.logo_id);
      } catch (deleteError) {
        console.error('Failed to delete old logo from Cloudinary:', deleteError);
      }
    }

    const logoUrl = uploadResult.url;
    const logoId = uploadResult.id;

    let result;
    if (existing) {
      result = await query(
        `UPDATE websites 
         SET logo = $1, logo_id = $2, updated_at = now()
         WHERE website_id = $3
         RETURNING *`,
        [logoUrl, logoId, existing.website_id]
      );
    } else {
      result = await query(
        `INSERT INTO websites (logo, logo_id)
         VALUES ($1, $2)
         RETURNING *`,
        [logoUrl, logoId]
      );
    }

    return Response.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Error saving website logo:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
