import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const result = await query(`
      SELECT 
        r.*,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE r.is_approved = TRUE
      ORDER BY r.review_id DESC
      LIMIT 3
    `);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching latest reviews:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
