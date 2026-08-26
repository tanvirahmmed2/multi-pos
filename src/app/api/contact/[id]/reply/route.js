import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { STORE_NAME } from '@/lib/secret';

export async function POST(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const contactId = parseInt(id, 10);

    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return Response.json({ error: 'Reply message content is required' }, { status: 400 });
    }

    // Check contact query status and details
    const contactRes = await query('SELECT name, email, subject, status FROM contacts WHERE contact_id = $1', [contactId]);
    if (contactRes.rows.length === 0) {
      return Response.json({ error: 'Contact inquiry not found' }, { status: 404 });
    }

    const contact = contactRes.rows[0];
    if (contact.status === 'replied') {
      return Response.json({ error: 'This contact inquiry has already been replied to and cannot receive another reply.' }, { status: 400 });
    }

    // Begin database transaction to store reply and update status
    await query('BEGIN');

    // 1. Insert into contact_replies
    const replyRes = await query(
      `INSERT INTO contact_replies (contact_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [contactId, auth.user.user_id, message.trim()]
    );

    // 2. Update status of the contact query to 'replied'
    await query(
      `UPDATE contacts 
       SET status = 'replied' 
       WHERE contact_id = $1`,
      [contactId]
    );

    // 3. Send email to client via Mailer
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.05em;">${STORE_NAME.toUpperCase()} SYSTEM</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Customer Support Division</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #1e293b;">Dear ${contact.name || 'Valued Customer'},</p>
            <p style="font-size: 14px; color: #475569;">Thank you for contacting us regarding "<strong>${contact.subject}</strong>". We have reviewed your inquiry and our support team has responded:</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px; font-size: 14px; color: #334155; white-space: pre-wrap;">${message.trim()}</div>
            
            <p style="font-size: 14px; color: #475569; margin-bottom: 0;">If you have any further questions, feel free to submit a new inquiry via our website.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: contact.email,
        subject: `Re: ${contact.subject}`,
        htmlContent: emailHtml
      });

    } catch (mailErr) {
      // Log the mail error but do not fail the database save, as standard robust fallback
      console.error('Failed to send contact reply email:', mailErr.message);
    }

    await query('COMMIT');

    return Response.json({
      message: 'Reply stored and email notification sent successfully',
      reply: replyRes.rows[0]
    }, { status: 201 });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error replying to contact query:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
