import { query } from '@/lib/db';
import { isStaff, isAdmin } from '@/lib/auth';
import { recordActivityLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await isStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const sql = `
      SELECT notice_id, title, description, notice_date, created_at, updated_at
      FROM notices
      ORDER BY notice_date DESC, notice_id DESC
    `;
    const result = await query(sql);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching notices:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { title, description, notice_date } = await req.json();

    if (!title || !title.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    const finalNoticeDate = notice_date ? new Date(notice_date) : new Date();

    const insertSql = `
      INSERT INTO notices (title, description, notice_date, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const result = await query(insertSql, [title.trim(), description.trim(), finalNoticeDate]);
    const createdNotice = result.rows[0];

    try {
      await recordActivityLog(
        auth.user.staff_id || auth.user.user_id,
        auth.user.name,
        auth.user.role,
        'CREATE_NOTICE',
        `Created notice: "${title.trim()}"`
      );
    } catch (logErr) {
      console.error('Failed to log notice creation:', logErr);
    }

    return Response.json(createdNotice, { status: 201 });
  } catch (error) {
    console.error('Error creating notice:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
