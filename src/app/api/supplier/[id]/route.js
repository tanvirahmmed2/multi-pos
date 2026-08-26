import { query } from '@/lib/db';
import { isManager } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const result = await query('SELECT * FROM suppliers WHERE supplier_id = $1', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching supplier:', error);
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
    const body = await req.json();
    const { name, company_name, phone, email, address, is_active } = body;

    if (!name || !phone) {
      return Response.json({ error: 'Supplier name and phone are required' }, { status: 400 });
    }

    const isActive = is_active === false ? false : true;

    const result = await query(
      `UPDATE suppliers 
       SET name = $1, company_name = $2, phone = $3, email = $4, address = $5, is_active = $6, updated_at = NOW()
       WHERE supplier_id = $7
       RETURNING *`,
      [name, company_name || null, phone, email || null, address || null, isActive, id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error updating supplier:', error);
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
    
    const result = await query('DELETE FROM suppliers WHERE supplier_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return Response.json({ message: 'Supplier deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
