import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const { id } = await params;
    const supportId = parseInt(id, 10);

    if (isNaN(supportId)) {
      return Response.json({ error: 'Invalid support ID' }, { status: 400 });
    }

    // Fetch the ticket
    const ticketRes = await query(`
      SELECT 
        s.*,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role
      FROM supports s
      LEFT JOIN users u ON s.user_id = u.user_id
      WHERE s.support_id = $1
    `, [supportId]);

    if (ticketRes.rows.length === 0) {
      return Response.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    const ticket = ticketRes.rows[0];
    const isStaff = ['admin', 'manager', 'sales'].includes(auth.user.role);

    // Access control
    if (!isStaff && ticket.user_id !== auth.user.user_id) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch all messages
    const messagesRes = await query(`
      SELECT 
        sm.*,
        u.name AS sender_name,
        u.email AS sender_email,
        u.role AS sender_role
      FROM support_messages sm
      LEFT JOIN users u ON sm.sender_id = u.user_id
      WHERE sm.support_id = $1
      ORDER BY sm.message_id ASC
    `, [supportId]);

    return Response.json({
      ticket,
      messages: messagesRes.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching support ticket details:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const { id } = await params;
    const supportId = parseInt(id, 10);

    if (isNaN(supportId)) {
      return Response.json({ error: 'Invalid support ID' }, { status: 400 });
    }

    const ticketRes = await query('SELECT * FROM supports WHERE support_id = $1', [supportId]);
    if (ticketRes.rows.length === 0) {
      return Response.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    const ticket = ticketRes.rows[0];
    const isStaff = ['admin', 'manager', 'sales'].includes(auth.user.role);
    const isOwner = ticket.user_id === auth.user.user_id;

    if (!isStaff && !isOwner) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { status, priority } = body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    // Customers can close/resolve their own ticket, staff can set any valid status
    if (status) {
      const validStatuses = ['pending', 'open', 'in_progress', 'resolved', 'closed'];
      if (validStatuses.includes(status)) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }
    }

    // Only staff can change ticket priority
    if (priority && isStaff) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (validPriorities.includes(priority)) {
        updates.push(`priority = $${paramCount++}`);
        values.push(priority);
      }
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(supportId);

    const updateQuery = `
      UPDATE supports 
      SET ${updates.join(', ')} 
      WHERE support_id = $${paramCount} 
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    return Response.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Error updating support ticket:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const isStaff = ['admin', 'manager'].includes(auth.user.role);
    if (!isStaff) {
      return Response.json({ error: 'Access denied: Manager/Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const supportId = parseInt(id, 10);

    if (isNaN(supportId)) {
      return Response.json({ error: 'Invalid support ID' }, { status: 400 });
    }

    const ticketRes = await query('SELECT * FROM supports WHERE support_id = $1', [supportId]);
    if (ticketRes.rows.length === 0) {
      return Response.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    await query('DELETE FROM supports WHERE support_id = $1', [supportId]);

    return Response.json({ message: 'Support ticket deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
