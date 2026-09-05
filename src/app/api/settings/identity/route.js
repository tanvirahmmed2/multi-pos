import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    let email = '';
    let phone = '';
    let address = '';
    let sociallink = '';
    let is_share_investment = false;
    let is_sale_active = true;
    let excluded_tax = false;
    let tax_amount = 0;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = body.email || '';
      phone = body.phone || '';
      address = body.address || '';
      sociallink = body.sociallink || '';
      is_share_investment = body.is_share_investment === true;
      is_sale_active = body.is_sale_active !== false;
      excluded_tax = body.excluded_tax === true;
      tax_amount = parseFloat(body.tax_amount) || 0;
    } else {
      const formData = await req.formData();
      email = formData.get('email') || '';
      phone = formData.get('phone') || '';
      address = formData.get('address') || '';
      sociallink = formData.get('sociallink') || '';
      const isShareRaw = formData.get('is_share_investment');
      is_share_investment = isShareRaw === 'true' || isShareRaw === true;
      const isSaleRaw = formData.get('is_sale_active');
      is_sale_active = isSaleRaw === null ? true : (isSaleRaw === 'true' || isSaleRaw === true);
      const excludedTaxRaw = formData.get('excluded_tax');
      excluded_tax = excludedTaxRaw === 'true' || excludedTaxRaw === true;
      tax_amount = formData.get('tax_amount') ? parseFloat(formData.get('tax_amount')) : 0;
    }

    const checkRes = await query('SELECT * FROM websites ORDER BY website_id ASC LIMIT 1');
    const existing = checkRes.rows.length > 0 ? checkRes.rows[0] : null;

    let result;
    if (existing) {
      result = await query(
        `UPDATE websites 
         SET email = $1, phone = $2, address = $3, sociallink = $4,
             is_share_investment = $5, is_sale_active = $6, excluded_tax = $7, tax_amount = $8, updated_at = now()
         WHERE website_id = $9
         RETURNING *`,
        [email, phone, address, sociallink, is_share_investment, is_sale_active, excluded_tax, tax_amount, existing.website_id]
      );
    } else {
      result = await query(
        `INSERT INTO websites (email, phone, address, sociallink, is_share_investment, is_sale_active, excluded_tax, tax_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [email, phone, address, sociallink, is_share_investment, is_sale_active, excluded_tax, tax_amount]
      );
    }

    return Response.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Error saving website identity settings:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
