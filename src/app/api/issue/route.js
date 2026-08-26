import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const currentStaffId = auth.staff ? auth.staff.staff_id : auth.user.user_id;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Action to fetch possible receivers for issues (other active staff members)
    if (action === 'receivers') {
      const receiversRes = await query(
        `SELECT staff_id, staff_id AS user_id, name, email, role 
         FROM staffs 
         WHERE role IN ('admin', 'manager', 'sales', 'staff') 
           AND is_active = TRUE 
           AND is_banned = FALSE 
           AND staff_id != $1
         ORDER BY name ASC`,
        [currentStaffId]
      );
      return Response.json(receiversRes.rows, { status: 200 });
    }

    // Default action: Fetch issue logs
    let result;
    const staffRole = auth.staff ? auth.staff.role : auth.user.role;
    if (staffRole === 'admin') {
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
        [currentStaffId]
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
    const currentStaffId = auth.staff ? auth.staff.staff_id : auth.user.user_id;

    // Verify receiver exists
    const recCheck = await query('SELECT role FROM staffs WHERE staff_id = $1', [receiverId]);
    if (recCheck.rows.length === 0) {
      return Response.json({ error: 'Recipient staff member not found' }, { status: 400 });
    }

    // Insert issue
    const result = await query(
      `INSERT INTO issues (sender_id, receiver_id, title, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [currentStaffId, receiverId, title.trim(), message.trim()]
    );

    return Response.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error('Error creating issue:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

