import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = typeof password === 'string' ? password.trim() : password;

    const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const user = result.rows[0];

    if (user.is_banned) {
      return Response.json({ error: 'Your account has been banned' }, { status: 403 });
    }

    if (!user.is_active) {
      return Response.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const allowedRoles = ['admin', 'manager', 'sales'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: 'Access denied: Only Admin, Manager, and Sales accounts can log in' }, { status: 403 });
    }

    const isPasswordMatch = await comparePassword(cleanPassword, user.password);
    if (!isPasswordMatch) {
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    if (!user.is_varified) {
      return Response.json({ error: 'Please verify your email address first' }, { status: 403 });
    }

    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('ecom_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, 
      path: '/',
    });

    const { password: _, varification_token: __, recover_token: ___, ...safeUser } = user;

    return Response.json(
      { message: 'Logged in successfully', user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
