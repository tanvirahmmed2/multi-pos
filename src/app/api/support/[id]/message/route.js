import { query } from '@/lib/db';
import { authenticateStaff } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';

export async function POST(req, { params }) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const { id } = await params;
    const supportId = parseInt(id, 10);
    const currentStaff = auth.staff || auth.user;

    if (isNaN(supportId)) {
      return Response.json({ error: 'Invalid support ID' }, { status: 400 });
    }

    try {
      const ticketRes = await query(`
        SELECT s.*, u.name AS user_name, u.email AS user_email 
        FROM supports s
        LEFT JOIN staffs u ON s.user_id = u.staff_id
        WHERE s.support_id = $1
      `, [supportId]);

      if (ticketRes.rows.length === 0) {
        return Response.json({ error: 'Support ticket not found' }, { status: 404 });
      }

      const ticket = ticketRes.rows[0];
      const isStaff = ['admin', 'manager', 'sales', 'staff'].includes(currentStaff.role);
      const isOwner = ticket.user_id === currentStaff.staff_id;

      if (!isStaff && !isOwner) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }

      const body = await req.json();
      const { message } = body;

      if (!message || !message.trim()) {
        return Response.json({ error: 'Message content is required' }, { status: 400 });
      }

      await query('BEGIN');

      const msgRes = await query(`
        INSERT INTO support_messages (support_id, sender_id, message)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [supportId, currentStaff.staff_id, message.trim()]);

      let newStatus = ticket.status;
      if (isStaff && ticket.status === 'pending') {
        newStatus = 'open';
      } else if (!isStaff && (ticket.status === 'closed' || ticket.status === 'resolved')) {
        newStatus = 'open';
      }

      await query(`
        UPDATE supports 
        SET status = $1, updated_at = NOW() 
        WHERE support_id = $2
      `, [newStatus, supportId]);

      await query('COMMIT');

      const responseMessage = msgRes.rows[0];
      responseMessage.sender_name = currentStaff.name;
      responseMessage.sender_email = currentStaff.email;
      responseMessage.sender_role = currentStaff.role;

      return Response.json(responseMessage, { status: 201 });
    } catch (tableError) {
      return Response.json({ error: 'Support feature unavailable' }, { status: 400 });
    }

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error adding support message:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

