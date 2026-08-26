import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { getBaseUrl, STORE_NAME } from '@/lib/secret';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email address is required' }, { status: 400 });
    }

    const result = await query('SELECT staff_id, name, email FROM staffs WHERE email = $1', [email.trim().toLowerCase()]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Email address not found' }, { status: 400 });
    }

    const staff = result.rows[0];
    const recoverToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      'UPDATE staffs SET recover_token = $1, recover_token_expires = $2 WHERE email = $3',
      [recoverToken, expiry, staff.email]
    );

    const baseUrl = getBaseUrl(req);
    const recoveryLink = `${baseUrl}/recover-account?token=${recoverToken}`;
    const mailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center;">Reset your ${STORE_NAME} Password</h2>
        <p>Hi ${staff.name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background-color: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #64748b;">${recoveryLink}</p>
      </div>
    `;

    try {
      await sendEmail({
        to: staff.email,
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
    console.error('Staff account recovery request error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return Response.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    const result = await query(
      'SELECT staff_id FROM staffs WHERE recover_token = $1 AND recover_token_expires > $2',
      [token, new Date()]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid or expired recovery token' }, { status: 400 });
    }

    const staff = result.rows[0];
    const hashedPassword = await hashPassword(password);

    await query(
      'UPDATE staffs SET password = $1, recover_token = NULL, recover_token_expires = NULL WHERE staff_id = $2',
      [hashedPassword, staff.staff_id]
    );

    return Response.json(
      { message: 'Password reset successful! You can now log in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Staff account recovery update error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
