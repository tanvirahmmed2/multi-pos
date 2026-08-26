import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Action to fetch possible receivers for issues (other active staff members)
    if (action === 'receivers') {
      const receiversRes = await query(
        `SELECT user_id, name, email, role 
         FROM users 
         WHERE role IN ('admin', 'manager', 'sales') 
           AND is_active = TRUE 
           AND is_banned = FALSE 
           AND user_id != $1
         ORDER BY name ASC`,
        [auth.user.user_id]
      );
      return Response.json(receiversRes.rows, { status: 200 });
    }

    // Default action: Fetch issue logs
    let result;
    if (auth.user.role === 'admin') {
      // Admins see all issues
      result = await query(`
        SELECT * 
        FROM issues_view 
        ORDER BY issue_id DESC
      `);
    } else {
      // Managers and Sales see issues they sent or received
      result = await query(
        `SELECT * 
         FROM issues_view 
         WHERE sender_id = $1 OR receiver_id = $1 
         ORDER BY issue_id DESC`,
        [auth.user.user_id]
      );
    }

    return Response.json(result.rows, { status: 200 });

  } catch (error) {
    console.error('Error fetching issues:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { receiver_id, title, message } = body;

    if (!receiver_id) {
      return Response.json({ error: 'Recipient is required' }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const receiverId = parseInt(receiver_id, 10);

    // Verify receiver exists
    const recCheck = await query('SELECT role FROM users WHERE user_id = $1', [receiverId]);
    if (recCheck.rows.length === 0) {
      return Response.json({ error: 'Recipient user not found' }, { status: 400 });
    }

    // Insert issue
    const result = await query(
      `INSERT INTO issues (sender_id, receiver_id, title, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [auth.user.user_id, receiverId, title.trim(), message.trim()]
    );

    return Response.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error('Error creating issue:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
