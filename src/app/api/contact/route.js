import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query(`
      SELECT 
        c.*,
        COALESCE(
          json_agg(
            json_build_object(
              'reply_id', cr.reply_id,
              'message', cr.message,
              'created_at', cr.created_at,
              'user_name', u.name,
              'user_email', u.email,
              'user_role', u.role
            ) ORDER BY cr.reply_id ASC
          ) FILTER (WHERE cr.reply_id IS NOT NULL),
          '[]'
        ) AS replies
      FROM contacts c
      LEFT JOIN contact_replies cr ON c.contact_id = cr.contact_id
      LEFT JOIN users u ON cr.user_id = u.user_id
      GROUP BY c.contact_id
      ORDER BY c.contact_id DESC
    `);

    return Response.json(result.rows, { status: 200 });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Validation
    if (!name || !name.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return Response.json({ error: 'Invalid email address format' }, { status: 400 });
    }
    if (!subject || !subject.trim()) {
      return Response.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO contacts (name, email, subject, message, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [name.trim(), email.trim(), subject.trim(), message.trim()]
    );

    return Response.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error('Error creating contact query:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
