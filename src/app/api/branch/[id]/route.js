import { query } from '@/lib/db';
import { isAdmin, isManagementRole } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const branchId = parseInt(id, 10);

    if (isNaN(branchId)) {
      return Response.json({ error: 'Invalid branch ID' }, { status: 400 });
    }

    const result = await query(
      `SELECT b.*,
              (SELECT COUNT(*)::int FROM staffs WHERE branch_id = b.branch_id) AS staff_count
       FROM branches b
       WHERE b.branch_id = $1`,
      [branchId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Branch not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching branch details:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .toUpperCase();
}

export async function PUT(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const branchId = parseInt(id, 10);

    if (isNaN(branchId)) {
      return Response.json({ error: 'Invalid branch ID' }, { status: 400 });
    }

    const checkBranch = await query('SELECT * FROM branches WHERE branch_id = $1', [branchId]);
    if (checkBranch.rows.length === 0) {
      return Response.json({ error: 'Branch not found' }, { status: 404 });
    }

    const existingBranch = checkBranch.rows[0];
    const body = await req.json();
    const { name, code, address, phone, email, is_active } = body;

    if (!name || !name.trim()) {
      return Response.json({ error: 'Branch name is required' }, { status: 400 });
    }

    let cleanCode = code && code.trim() ? code.trim() : null;

    if (!cleanCode) {
      let generatedCode = slugify(name.trim());
      let counter = 1;
      while (true) {
        const checkCode = await query('SELECT branch_id FROM branches WHERE UPPER(code) = UPPER($1) AND branch_id != $2', [generatedCode, branchId]);
        if (checkCode.rows.length === 0) break;
        generatedCode = `${slugify(name.trim())}-${counter++}`;
      }
      cleanCode = generatedCode;
    } else {
      const checkCode = await query('SELECT branch_id FROM branches WHERE UPPER(code) = UPPER($1) AND branch_id != $2', [cleanCode, branchId]);
      if (checkCode.rows.length > 0) {
        return Response.json({ error: `Branch code "${cleanCode}" is already used by another branch` }, { status: 400 });
      }
    }

    const activeStatus = is_active !== false;

    const result = await query(
      `UPDATE branches 
       SET name = $1, code = $2, address = $3, phone = $4, email = $5, is_active = $6, updated_at = NOW() 
       WHERE branch_id = $7 
       RETURNING *`,
      [name.trim(), cleanCode, address?.trim() || null, phone?.trim() || null, email?.trim() || null, activeStatus, branchId]
    );

    return Response.json({ message: 'Branch updated successfully', branch: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating branch:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const branchId = parseInt(id, 10);

    if (isNaN(branchId)) {
      return Response.json({ error: 'Invalid branch ID' }, { status: 400 });
    }

    const result = await query('DELETE FROM branches WHERE branch_id = $1 RETURNING branch_id', [branchId]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Branch not found' }, { status: 404 });
    }

    return Response.json({ message: 'Branch deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
