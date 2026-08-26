import { query } from '@/lib/db';
import { isAdmin, hashPassword } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query(`
      SELECT staff_id, staff_id AS user_id, branch_id, name, email, phone, role, is_active, is_varified, is_banned, created_at 
      FROM staffs 
      ORDER BY staff_id ASC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching staff members:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { name, email, phone, password, role, is_active, is_varified, branch_id } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const checkEmail = await query('SELECT staff_id FROM staffs WHERE LOWER(email) = $1', [cleanEmail]);
    if (checkEmail.rows.length > 0) {
      return Response.json({ error: 'Email address is already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const staffRole = role && ['admin', 'manager', 'sales', 'staff'].includes(role) ? role : 'staff';
    const activeStatus = is_active !== false;
    const verifiedStatus = is_varified !== false;
    const branchIdVal = branch_id ? parseInt(branch_id, 10) : null;

    if (staffRole !== 'admin' && !branchIdVal) {
      return Response.json({ error: 'Branch selection is required for non-admin staff roles' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO staffs (branch_id, name, email, phone, password, role, is_active, is_varified, is_banned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING staff_id, staff_id AS user_id, branch_id, name, email, phone, role, is_active, is_varified, is_banned, created_at`,
      [branchIdVal, name.trim(), cleanEmail, phone ? phone.trim() : null, hashedPassword, staffRole, activeStatus, verifiedStatus, false]
    );

    return Response.json({ message: 'Staff member created successfully', staff: result.rows[0], user: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff member:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

