import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const personal = searchParams.get('personal') === 'true';

    // 1. Management view: All reviews (both approved and pending)
    if (all) {
      const auth = await authenticateUser();
      if (!auth.success) {
        return Response.json({ error: auth.message }, { status: 401 });
      }

      const isStaff = ['admin', 'manager', 'sales'].includes(auth.user.role);
      if (!isStaff) {
        return Response.json({ error: 'Access denied: Staff role required' }, { status: 403 });
      }

      const result = await query(`
        SELECT 
          r.*,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.user_id
        ORDER BY r.review_id DESC
      `);
      return Response.json(result.rows, { status: 200 });
    }

    // 2. Personal customer view: Own reviews (both approved and pending)
    if (personal) {
      const auth = await authenticateUser();
      if (!auth.success) {
        return Response.json({ error: auth.message }, { status: 401 });
      }

      const result = await query(`
        SELECT 
          r.*,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.user_id = $1
        ORDER BY r.review_id DESC
      `, [auth.user.user_id]);
      return Response.json(result.rows, { status: 200 });
    }

    // 3. Public testimonials view: Approved reviews only
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
    `);
    return Response.json(result.rows, { status: 200 });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const body = await req.json();
    const { rating, title, comment } = body;

    // Limit check: Check if user already submitted a review
    const checkRes = await query('SELECT review_id FROM reviews WHERE user_id = $1 LIMIT 1', [auth.user.user_id]);
    if (checkRes.rows.length > 0) {
      return Response.json({ error: 'You have already submitted a review. You can delete your existing review to write a new one.' }, { status: 400 });
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return Response.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    const cleanComment = comment ? comment.replace(/<[^>]*>/g, '').trim() : '';
    const cleanTitle = title ? title.replace(/<[^>]*>/g, '').trim() : '';

    const result = await query(`
      INSERT INTO reviews (user_id, rating, title, comment, is_approved)
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING *
    `, [auth.user.user_id, ratingVal, cleanTitle, cleanComment]);

    const newReview = result.rows[0];
    newReview.user_name = auth.user.name;
    newReview.user_email = auth.user.email;
    newReview.user_role = auth.user.role;

    return Response.json(newReview, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
