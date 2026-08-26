import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { getBaseUrl, STORE_NAME } from '@/lib/secret';
import crypto from 'crypto';

// POST: Request password recovery link
export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Query user by email (raw PostgreSQL query)
    const result = await query('SELECT user_id, name, email FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Email address not found' },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    // Generate recover token and expiry (1 hour from now)
    const recoverToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user record (raw PostgreSQL query)
    await query(
      'UPDATE users SET recover_token = $1, recover_token_expires = $2 WHERE email = $3',
      [recoverToken, expiry, email]
    );

    // Send recovery email via Brevo
    const baseUrl = getBaseUrl(req);
    const recoveryLink = `${baseUrl}/recover-account?token=${recoverToken}`;
    const mailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center;">Reset your ${STORE_NAME} Password</h2>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background-color: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #64748b;">${recoveryLink}</p>
        <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8;">
          This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: `Reset your ${STORE_NAME} Password`,
        htmlContent: mailContent,
      });
    } catch (mailError) {
      console.error('Failed to send recovery email:', mailError);
    }

    return Response.json(
      { message: 'A password reset link has been sent to your email.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Account recovery request error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Reset the password using the token
export async function PUT(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return Response.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    // Query user by token and confirm it has not expired (raw PostgreSQL query)
    const result = await query(
      'SELECT user_id FROM users WHERE recover_token = $1 AND recover_token_expires > $2',
      [token, new Date()]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid or expired recovery token' }, { status: 400 });
    }

    const user = result.rows[0];

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user record, clearing recovery token info (raw PostgreSQL query)
    await query(
      'UPDATE users SET password = $1, recover_token = NULL, recover_token_expires = NULL WHERE user_id = $2',
      [hashedPassword, user.user_id]
    );

    return Response.json(
      { message: 'Password reset successful! You can now log in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Account recovery update error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
