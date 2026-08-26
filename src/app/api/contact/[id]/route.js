import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const contactId = parseInt(id, 10);

    const checkRes = await query('SELECT contact_id FROM contacts WHERE contact_id = $1', [contactId]);
    if (checkRes.rows.length === 0) {
      return Response.json({ error: 'Contact inquiry not found' }, { status: 404 });
    }

    await query('DELETE FROM contacts WHERE contact_id = $1', [contactId]);

    return Response.json({ message: 'Contact inquiry deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting contact inquiry:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
