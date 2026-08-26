import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const isStaff = ['admin', 'manager', 'sales'].includes(auth.user.role);
    let result;

    if (isStaff) {
      // Staff members see all tickets, joining user details
      result = await query(`
        SELECT 
          s.*,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role
        FROM supports s
        LEFT JOIN users u ON s.user_id = u.user_id
        ORDER BY s.updated_at DESC, s.support_id DESC
      `);
    } else {
      // Normal customers see only their own tickets
      result = await query(`
        SELECT 
          s.*,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role
        FROM supports s
        LEFT JOIN users u ON s.user_id = u.user_id
        WHERE s.user_id = $1
        ORDER BY s.updated_at DESC, s.support_id DESC
      `, [auth.user.user_id]);
    }

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const body = await req.json();
    const { subject, description, priority } = body;

    if (!subject || !subject.trim()) {
      return Response.json({ error: 'Subject is required' }, { status: 400 });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

    const result = await query(`
      INSERT INTO supports (user_id, subject, description, priority, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `, [auth.user.user_id, subject.trim(), description?.trim() || '', ticketPriority]);

    const newTicket = result.rows[0];
    newTicket.user_name = auth.user.name;
    newTicket.user_email = auth.user.email;
    newTicket.user_role = auth.user.role;

    return Response.json(newTicket, { status: 201 });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
