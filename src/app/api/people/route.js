import { query } from '@/lib/db';
import { isAdmin, hashPassword } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query(`
      SELECT user_id, name, email, phone, role, is_active, is_varified, is_banned, created_at 
      FROM users 
      ORDER BY user_id ASC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { name, email, phone, password, role, is_active, is_varified } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const checkEmail = await query('SELECT user_id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (checkEmail.rows.length > 0) {
      return Response.json({ error: 'Email address is already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role && ['admin', 'manager', 'sales', 'user'].includes(role) ? role : 'user';
    const activeStatus = is_active !== false;
    const verifiedStatus = is_varified !== false;

    const result = await query(
      `INSERT INTO users (name, email, phone, password, role, is_active, is_varified, is_banned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, name, email, phone, role, is_active, is_varified, is_banned, created_at`,
      [name.trim(), cleanEmail, phone ? phone.trim() : null, hashedPassword, userRole, activeStatus, verifiedStatus, false]
    );

    return Response.json({ message: 'User created successfully', user: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
