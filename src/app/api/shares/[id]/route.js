import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message || 'Access denied: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const result = await query(
      `SELECT 
        s.*,
        i.name AS investor_name,
        i.phone AS investor_phone,
        i.email AS investor_email
      FROM shares s
      LEFT JOIN investors i ON s.investor_id = i.investor_id
      WHERE s.share_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Share allocation not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching share allocation:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message || 'Access denied: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { investor_id, share_percentage, status, note } = body;

    if (!investor_id) {
      return Response.json({ error: 'Investor is required' }, { status: 400 });
    }

    if (share_percentage === undefined || share_percentage === null || share_percentage === '') {
      return Response.json({ error: 'Share percentage is required' }, { status: 400 });
    }

    const percentage = parseFloat(share_percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return Response.json({ error: 'Share percentage must be between 0 and 100' }, { status: 400 });
    }

    const result = await query(
      `UPDATE shares
       SET investor_id = $1,
           share_percentage = $2,
           status = $3,
           note = $4,
           updated_at = NOW()
       WHERE share_id = $5
       RETURNING *`,
      [
        parseInt(investor_id, 10),
        percentage,
        status || 'active',
        note || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Share allocation not found' }, { status: 404 });
    }

    const updated = result.rows[0];
    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'UPDATE_SHARE',
      entity: 'shares',
      entityId: id,
      details: `Updated share allocation ID ${id} (${updated.share_percentage}%)`
    });

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating share allocation:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message || 'Access denied: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const result = await query('DELETE FROM shares WHERE share_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Share allocation not found' }, { status: 404 });
    }

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'DELETE_SHARE',
      entity: 'shares',
      entityId: id,
      details: `Deleted share allocation ID ${id}`
    });

    return Response.json({ message: 'Share allocation deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting share allocation:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
