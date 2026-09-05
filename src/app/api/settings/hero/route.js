import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    let hero_title = '';
    let hero_subtitle = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      hero_title = body.hero_title || '';
      hero_subtitle = body.hero_subtitle || '';
    } else {
      const formData = await req.formData();
      hero_title = formData.get('hero_title') || '';
      hero_subtitle = formData.get('hero_subtitle') || '';
    }

    const checkRes = await query('SELECT * FROM websites ORDER BY website_id ASC LIMIT 1');
    const existing = checkRes.rows.length > 0 ? checkRes.rows[0] : null;

    let result;
    if (existing) {
      result = await query(
        `UPDATE websites 
         SET hero_title = $1, hero_subtitle = $2, updated_at = now()
         WHERE website_id = $3
         RETURNING *`,
        [hero_title, hero_subtitle, existing.website_id]
      );
    } else {
      result = await query(
        `INSERT INTO websites (hero_title, hero_subtitle)
         VALUES ($1, $2)
         RETURNING *`,
        [hero_title, hero_subtitle]
      );
    }

    return Response.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Error saving hero section settings:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
