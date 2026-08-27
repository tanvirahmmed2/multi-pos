import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const result = await query('SELECT * FROM websites ORDER BY website_id ASC LIMIT 1');
    if (result.rows.length === 0) {
      return Response.json({}, { status: 200 });
    }
    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching website settings:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const formData = await req.formData();
    const hero_title = formData.get('hero_title') || '';
    const hero_subtitle = formData.get('hero_subtitle') || '';
    const address = formData.get('address') || '';
    const sociallink = formData.get('sociallink') || '';
    const email = formData.get('email') || '';
    const phone = formData.get('phone') || '';
    
    const logoFile = formData.get('logo'); 

    const checkRes = await query('SELECT * FROM websites ORDER BY website_id ASC LIMIT 1');
    const existing = checkRes.rows.length > 0 ? checkRes.rows[0] : null;

    let logoUrl = existing ? existing.logo : null;
    let logoId = existing ? existing.logo_id : null;

    if (logoFile && typeof logoFile !== 'string' && logoFile.name) {
      const uploadResult = await uploadToCloudinary(logoFile, 'settings');
      if (uploadResult) {
        if (existing && existing.logo_id) {
          try {
            await deleteFromCloudinary(existing.logo_id);
          } catch (deleteError) {
            console.error('Failed to delete old logo from Cloudinary:', deleteError);
          }
        }
        logoUrl = uploadResult.url;
        logoId = uploadResult.id;
      }
    }

    let result;
    if (existing) {
      result = await query(
        `UPDATE websites 
         SET logo = $1, logo_id = $2, hero_title = $3, hero_subtitle = $4,
             address = $5, sociallink = $6, email = $7, phone = $8,
             updated_at = now()
         WHERE website_id = $9
         RETURNING *`,
        [logoUrl, logoId, hero_title, hero_subtitle, address, sociallink, email, phone, existing.website_id]
      );
    } else {
      result = await query(
        `INSERT INTO websites (logo, logo_id, hero_title, hero_subtitle, address, sociallink, email, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [logoUrl, logoId, hero_title, hero_subtitle, address, sociallink, email, phone]
      );
    }

    return Response.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Error saving website settings:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
