import { query } from '@/lib/db';
import { authenticateStaff } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const currentStaffId = auth.staff ? auth.staff.staff_id : auth.user.user_id;
    const isStaffRole = ['admin', 'manager', 'sales', 'staff'].includes(auth.staff ? auth.staff.role : auth.user.role);
    let result;

    try {
      if (isStaffRole) {
        result = await query(`
          SELECT 
            s.*,
            u.name AS user_name,
            u.email AS user_email,
            u.role AS user_role
          FROM supports s
          LEFT JOIN staffs u ON s.user_id = u.staff_id
          ORDER BY s.updated_at DESC, s.support_id DESC
        `);
      } else {
        result = await query(`
          SELECT 
            s.*,
            u.name AS user_name,
            u.email AS user_email,
            u.role AS user_role
          FROM supports s
          LEFT JOIN staffs u ON s.user_id = u.staff_id
          WHERE s.user_id = $1
          ORDER BY s.updated_at DESC, s.support_id DESC
        `, [currentStaffId]);
      }
      return Response.json(result.rows, { status: 200 });
    } catch (tableError) {
      return Response.json([], { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const currentStaff = auth.staff || auth.user;
    const body = await req.json();
    const { subject, description, priority } = body;

    if (!subject || !subject.trim()) {
      return Response.json({ error: 'Subject is required' }, { status: 400 });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

    try {
      const result = await query(`
        INSERT INTO supports (user_id, subject, description, priority, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `, [currentStaff.staff_id, subject.trim(), description?.trim() || '', ticketPriority]);

      const newTicket = result.rows[0];
      newTicket.user_name = currentStaff.name;
      newTicket.user_email = currentStaff.email;
      newTicket.user_role = currentStaff.role;

      return Response.json(newTicket, { status: 201 });
    } catch (tableError) {
      return Response.json({ error: 'Support feature is unavailable' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

