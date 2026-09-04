import { query } from '@/lib/db';
import { isStaff, isAdmin } from '@/lib/auth';
import { recordActivityLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const auth = await isStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const { id } = await params;
    const result = await query('SELECT * FROM notices WHERE notice_id = $1 LIMIT 1', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Notice not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching single notice:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const { title, description, notice_date } = await req.json();

    if (!title || !title.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    const checkRes = await query('SELECT * FROM notices WHERE notice_id = $1 LIMIT 1', [id]);
    if (checkRes.rows.length === 0) {
      return Response.json({ error: 'Notice not found' }, { status: 404 });
    }

    const finalNoticeDate = notice_date ? new Date(notice_date) : checkRes.rows[0].notice_date;

    const updateSql = `
      UPDATE notices
      SET title = $1, description = $2, notice_date = $3, updated_at = NOW()
      WHERE notice_id = $4
      RETURNING *
    `;
    const result = await query(updateSql, [title.trim(), description.trim(), finalNoticeDate, id]);
    const updatedNotice = result.rows[0];

    try {
      await recordActivityLog(
        auth.user.staff_id || auth.user.user_id,
        auth.user.name,
        auth.user.role,
        'UPDATE_NOTICE',
        `Updated notice #${id}: "${title.trim()}"`
      );
    } catch (logErr) {
      console.error('Failed to log notice update:', logErr);
    }

    return Response.json(updatedNotice, { status: 200 });
  } catch (error) {
    console.error('Error updating notice:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const checkRes = await query('SELECT title FROM notices WHERE notice_id = $1 LIMIT 1', [id]);
    if (checkRes.rows.length === 0) {
      return Response.json({ error: 'Notice not found' }, { status: 404 });
    }

    const noticeTitle = checkRes.rows[0].title;

    await query('DELETE FROM notices WHERE notice_id = $1', [id]);

    try {
      await recordActivityLog(
        auth.user.staff_id || auth.user.user_id,
        auth.user.name,
        auth.user.role,
        'DELETE_NOTICE',
        `Deleted notice #${id}: "${noticeTitle}"`
      );
    } catch (logErr) {
      console.error('Failed to log notice deletion:', logErr);
    }

    return Response.json({ success: true, message: 'Notice deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting notice:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
