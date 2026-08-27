import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { recordLoginLog, recordActivityLog } from '@/lib/logger';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = typeof password === 'string' ? password.trim() : password;

    const result = await query('SELECT * FROM staffs WHERE LOWER(email) = $1', [cleanEmail]);

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

    // Record login log and activity log
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
