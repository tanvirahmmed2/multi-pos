import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';

export async function POST(req, { params }) {
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

    // Verify ticket exists
    const ticketRes = await query(`
      SELECT s.*, u.name AS user_name, u.email AS user_email 
      FROM supports s
      LEFT JOIN users u ON s.user_id = u.user_id
      WHERE s.support_id = $1
    `, [supportId]);

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
    const { message } = body;

    if (!message || !message.trim()) {
      return Response.json({ error: 'Message content is required' }, { status: 400 });
    }

    await query('BEGIN');

    // 1. Insert the message
    const msgRes = await query(`
      INSERT INTO support_messages (support_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [supportId, auth.user.user_id, message.trim()]);

    // 2. Update status and updated_at
    let newStatus = ticket.status;
    if (isStaff && ticket.status === 'pending') {
      newStatus = 'open'; // Switch from pending to open since staff replied
    } else if (!isStaff && (ticket.status === 'closed' || ticket.status === 'resolved')) {
      newStatus = 'open'; // Reopen the ticket when user sends a message
    }

    await query(`
      UPDATE supports 
      SET status = $1, updated_at = NOW() 
      WHERE support_id = $2
    `, [newStatus, supportId]);

    await query('COMMIT');

    const responseMessage = msgRes.rows[0];
    responseMessage.sender_name = auth.user.name;
    responseMessage.sender_email = auth.user.email;
    responseMessage.sender_role = auth.user.role;

    // 3. Email Notification (Premium Quality Action)
    // Send email alert to customer when a staff member responds
    try {
      if (isStaff && ticket.user_email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
            <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.05em;">CUSTOMER SUPPORT</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">New response to your support ticket #${supportId}</p>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #1e293b;">Dear ${ticket.user_name || 'Valued Customer'},</p>
              <p style="font-size: 14px; color: #475569;">Our support agent <strong>${auth.user.name}</strong> has responded to your ticket "<strong>${ticket.subject}</strong>":</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px; font-size: 14px; color: #334155; white-space: pre-wrap;">${message.trim()}</div>
              
              <p style="font-size: 14px; color: #475569; margin-bottom: 24px;">Please log in to your account and go to the Support panel to view the thread and respond.</p>
            </div>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
            </div>
          </div>
        `;

        await sendEmail({
          to: ticket.user_email,
          subject: `[Support Ticket #${supportId}] Re: ${ticket.subject}`,
          htmlContent: emailHtml
        });
      }
    } catch (mailErr) {
      console.error('Failed to send support message email notification:', mailErr.message);
    }

    return Response.json(responseMessage, { status: 201 });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error adding support message:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
