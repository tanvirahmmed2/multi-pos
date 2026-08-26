import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query('SELECT * FROM suppliers ORDER BY supplier_id ASC');
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { name, company_name, phone, email, address, is_active } = body;

    if (!name || !phone) {
      return Response.json({ error: 'Supplier name and phone are required' }, { status: 400 });
    }

    const isActive = is_active === false ? false : true;

    const result = await query(
      `INSERT INTO suppliers (name, company_name, phone, email, address, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, company_name || null, phone, email || null, address || null, isActive]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
