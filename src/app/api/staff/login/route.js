import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { recordLoginLog, recordActivityLog } from '@/lib/logger';
import { sendEmail } from '@/lib/mailer';
import { STORE_NAME } from '@/lib/secret';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = typeof password === 'string' ? password.trim() : password;

    const result = await query(
      `SELECT s.*, b.name as branch_name 
       FROM staffs s 
       LEFT JOIN branches b ON s.branch_id = b.branch_id 
       WHERE LOWER(s.email) = $1`, 
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      await recordLoginLog(req, { email: cleanEmail, status: 'failed' });
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const staff = result.rows[0];

    if (staff.is_banned) {
      await recordLoginLog(req, { staffId: staff.staff_id, email: staff.email, role: staff.role, status: 'failed' });
      return Response.json({ error: 'Your staff account has been banned' }, { status: 403 });
    }

    if (!staff.is_active) {
      await recordLoginLog(req, { staffId: staff.staff_id, email: staff.email, role: staff.role, status: 'failed' });
      return Response.json({ error: 'Staff account is deactivated' }, { status: 403 });
    }

    const allowedRoles = ['admin', 'manager', 'sales', 'staff'];
    if (!allowedRoles.includes(staff.role)) {
      await recordLoginLog(req, { staffId: staff.staff_id, email: staff.email, role: staff.role, status: 'failed' });
      return Response.json({ error: 'Access denied: Invalid staff role' }, { status: 403 });
    }

    const isPasswordMatch = await comparePassword(cleanPassword, staff.password);
    if (!isPasswordMatch) {
      await recordLoginLog(req, { staffId: staff.staff_id, email: staff.email, role: staff.role, status: 'failed' });
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    if (!staff.is_varified) {
      await recordLoginLog(req, { staffId: staff.staff_id, email: staff.email, role: staff.role, status: 'failed' });
      return Response.json({ error: 'Please verify your email address first' }, { status: 403 });
    }

    // Check if Two-Factor Authentication is enabled for staff
    if (staff['2fa_active'] === true) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      await query(
        `UPDATE staffs 
         SET "2fa_code" = $1, "2fa_expires_at" = NOW() + INTERVAL '10 minutes' 
         WHERE staff_id = $2`,
        [otpCode, staff.staff_id]
      );

      const mailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: bold; margin-bottom: 8px;">${STORE_NAME} Login Verification</h2>
          <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">Hi ${staff.name},</p>
          <p style="color: #475569; font-size: 14px;">Your 2FA login verification code is:</p>
          <div style="background-color: #f1f5f9; text-align: center; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes. If you did not attempt to log in, please secure your account password immediately.</p>
        </div>
      `;

      try {
        await sendEmail({
          to: staff.email,
          subject: `[${STORE_NAME}] Your Login 2FA Code`,
          htmlContent: mailHtml,
        });
      } catch (emailErr) {
        console.error('Failed to send login 2FA email via Brevo:', emailErr);
      }

      return Response.json(
        {
          require_2fa: true,
          email: staff.email,
          message: 'Two-factor verification code sent to your email'
        },
        { status: 200 }
      );
    }

    // Generate Session Token and store in staff_sessions
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipAddress = rawIp.split(',')[0].trim();

    await query(
      `INSERT INTO staff_sessions (staff_id, session_token, user_agent, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [staff.staff_id, sessionToken, userAgent, ipAddress]
    );

    const token = generateToken({
      staff_id: staff.staff_id,
      user_id: staff.staff_id,
      email: staff.email,
      role: staff.role,
      branch_id: staff.branch_id,
      session_token: sessionToken
    });

    const cookieStore = await cookies();
    cookieStore.set('ecom_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    await recordLoginLog(req, { staffId: staff.staff_id, email: staff.email, role: staff.role, status: 'success' });
    await recordActivityLog(req, {
      staffId: staff.staff_id,
      action: 'STAFF_LOGIN',
      entity: 'staffs',
      entityId: staff.staff_id,
      details: `Staff member ${staff.name} (${staff.role}) logged in successfully`
    });

    const { password: _, varification_token: __, recover_token: ___, ...safeStaff } = staff;
    const responseData = { ...safeStaff, user_id: staff.staff_id };

    return Response.json(
      { message: 'Logged in successfully', staff: responseData, user: responseData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Staff login error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
