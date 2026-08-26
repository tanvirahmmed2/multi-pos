import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);

    // Prevent self-modification
    if (auth.user.user_id === targetUserId) {
      return Response.json(
        { error: 'Admins cannot modify their own role, active status, or ban status to prevent lockout' },
        { status: 400 }
      );
    }

    const checkUser = await query('SELECT * FROM users WHERE user_id = $1', [targetUserId]);
    if (checkUser.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { role, is_banned, is_active } = body;

    // Build dynamic UPDATE query
    const fieldsToUpdate = [];
    const values = [];
    let placeholderCounter = 1;

    if (role !== undefined) {
      const allowedRoles = ['admin', 'manager', 'sales', 'user'];
      if (!allowedRoles.includes(role)) {
        return Response.json({ error: 'Invalid role specified' }, { status: 400 });
      }
      fieldsToUpdate.push(`role = $${placeholderCounter++}`);
      values.push(role);
    }

    if (is_banned !== undefined) {
      fieldsToUpdate.push(`is_banned = $${placeholderCounter++}`);
      values.push(!!is_banned);
    }

    if (is_active !== undefined) {
      fieldsToUpdate.push(`is_active = $${placeholderCounter++}`);
      values.push(!!is_active);
    }

    if (fieldsToUpdate.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add user_id as final parameter
    values.push(targetUserId);
    const updateQuery = `
      UPDATE users 
      SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() 
      WHERE user_id = $${placeholderCounter} 
      RETURNING user_id, name, email, phone, role, is_active, is_varified, is_banned, created_at
    `;

    const result = await query(updateQuery, values);
    return Response.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Error updating user:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
