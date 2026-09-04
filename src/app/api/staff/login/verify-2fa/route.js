import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { recordLoginLog, recordActivityLog } from '@/lib/logger';

export async function POST(req) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ error: 'Email and 2FA verification code are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const result = await query('SELECT *, ("2fa_expires_at" > NOW()) as is_not_expired FROM staffs WHERE LOWER(email) = $1', [cleanEmail]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid staff account' }, { status: 404 });
    }

    const staff = result.rows[0];

    if (staff.is_banned) {
      return Response.json({ error: 'Account is banned' }, { status: 403 });
    }

    if (!staff.is_active) {
      return Response.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    if (staff['2fa_active'] !== true) {
      return Response.json({ error: 'Two-factor authentication is not active for this account' }, { status: 400 });
    }

    const twoFaCode = staff['2fa_code'];
    const isNotExpired = Boolean(staff.is_not_expired);

    if (!twoFaCode || twoFaCode !== cleanCode) {
      await recordLoginLog(req, { staffId: staff.staff_id, email: staff.email, role: staff.role, status: 'failed' });
      return Response.json({ error: 'Invalid 2FA verification code' }, { status: 400 });
    }

    if (!isNotExpired) {
      await recordLoginLog(req, { staffId: staff.staff_id, email: staff.email, role: staff.role, status: 'failed' });
      return Response.json({ error: '2FA verification code has expired. Please log in again to receive a new code.' }, { status: 400 });
    }

    // Clear 2FA code fields
    await query(
      `UPDATE staffs 
       SET "2fa_code" = NULL, "2fa_expires_at" = NULL, updated_at = NOW() 
       WHERE staff_id = $1`,
      [staff.staff_id]
    );

    const token = generateToken({
      staff_id: staff.staff_id,
      user_id: staff.staff_id,
      email: staff.email,
      role: staff.role,
      branch_id: staff.branch_id
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
      action: 'STAFF_LOGIN_2FA',
      entity: 'staffs',
      entityId: staff.staff_id,
      details: `Staff member ${staff.name} (${staff.role}) passed 2FA verification and logged in successfully`
    });

    const { password: _, varification_token: __, recover_token: ___, '2fa_code': ____, ...safeStaff } = staff;
    const responseData = { ...safeStaff, user_id: staff.staff_id };

    return Response.json(
      { message: '2FA Verification successful! Logged in.', staff: responseData, user: responseData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Staff 2FA login verification error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
