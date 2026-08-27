import { query } from '@/lib/db';
import { isAdmin, isManagementRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const result = await query(`
      SELECT b.*,
             (SELECT COUNT(*)::int FROM staffs WHERE branch_id = b.branch_id) AS staff_count
      FROM branches b
      ORDER BY b.branch_id ASC
    `);

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching branches:', error);
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

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { name, address, phone, email, is_active } = body;

    if (!name || !name.trim()) {
      return Response.json({ error: 'Branch name is required' }, { status: 400 });
    }

    let generatedCode = slugify(name.trim());
    let counter = 1;
    while (true) {
      const checkCode = await query('SELECT branch_id FROM branches WHERE UPPER(code) = UPPER($1)', [generatedCode]);
      if (checkCode.rows.length === 0) break;
      generatedCode = `${slugify(name.trim())}-${counter++}`;
    }

    const activeStatus = is_active !== false;

    const result = await query(
      `INSERT INTO branches (name, code, address, phone, email, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name.trim(), generatedCode, address?.trim() || null, phone?.trim() || null, email?.trim() || null, activeStatus]
    );

    return Response.json({ message: 'Branch created successfully', branch: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

