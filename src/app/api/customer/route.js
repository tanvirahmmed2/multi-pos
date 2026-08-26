import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function GET(req) {
  try {
    // Authenticate user
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const isStaff = ['admin', 'manager', 'sales'].includes(auth.user.role);
    if (!isStaff) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search');

    let sql = 'SELECT * FROM customers';
    let params = [];

    if (search) {
      sql += ' WHERE phone LIKE $1 OR name ILIKE $1 OR email ILIKE $1';
      params.push(`%${search.trim()}%`);
    }

    sql += ' ORDER BY name ASC LIMIT 50';

    const result = await query(sql, params);
    return Response.json(result.rows, { status: 200 });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
