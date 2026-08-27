import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const targetStaffId = parseInt(id, 10);
    const currentStaffId = auth.staff ? auth.staff.staff_id : auth.user.user_id;

    if (currentStaffId === targetStaffId) {
      return Response.json(
        { error: 'Admins cannot modify their own role, active status, or ban status to prevent lockout' },
        { status: 400 }
      );
    }

    const checkStaff = await query('SELECT * FROM staffs WHERE staff_id = $1', [targetStaffId]);
    if (checkStaff.rows.length === 0) {
      return Response.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const body = await req.json();
    const { role, is_banned, is_active, branch_id } = body;

    const existingStaff = checkStaff.rows[0];
    const targetRole = role !== undefined ? role : existingStaff.role;
    const targetBranchId = branch_id !== undefined ? (branch_id ? parseInt(branch_id, 10) : null) : existingStaff.branch_id;

    if (targetRole !== 'admin' && !targetBranchId) {
      return Response.json({ error: 'Branch assignment is required for non-admin staff roles' }, { status: 400 });
    }

    const fieldsToUpdate = [];
    const values = [];
    let placeholderCounter = 1;

    if (role !== undefined) {
      const allowedRoles = ['admin', 'manager', 'sales', 'staff'];
      if (!allowedRoles.includes(role)) {
        return Response.json({ error: 'Invalid staff role specified' }, { status: 400 });
      }
      fieldsToUpdate.push(`role = $${placeholderCounter++}`);
      values.push(role);
    }

    if (branch_id !== undefined) {
      fieldsToUpdate.push(`branch_id = $${placeholderCounter++}`);
      values.push(targetBranchId);
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

    values.push(targetStaffId);
    const updateQuery = `
      UPDATE staffs 
      SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() 
      WHERE staff_id = $${placeholderCounter} 
      RETURNING staff_id, staff_id AS user_id, branch_id, name, email, phone, role, is_active, is_varified, is_banned, created_at
    `;

    const result = await query(updateQuery, values);
    return Response.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Error updating staff member:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

