import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const isStaff = ['admin', 'manager', 'sales'].includes(auth.user.role);
    if (!isStaff) {
      return Response.json({ error: 'Access denied: Staff role required' }, { status: 403 });
    }

    const { id } = await params;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId)) {
      return Response.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    // Verify review exists
    const reviewRes = await query('SELECT * FROM reviews WHERE review_id = $1', [reviewId]);
    if (reviewRes.rows.length === 0) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    const body = await req.json();
    const { is_approved } = body;

    if (typeof is_approved !== 'boolean') {
      return Response.json({ error: 'is_approved must be a boolean' }, { status: 400 });
    }

    const result = await query(`
      UPDATE reviews 
      SET is_approved = $1, updated_at = NOW() 
      WHERE review_id = $2 
      RETURNING *
    `, [is_approved, reviewId]);

    return Response.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Error updating review status:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const { id } = await params;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId)) {
      return Response.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    const reviewRes = await query('SELECT * FROM reviews WHERE review_id = $1', [reviewId]);
    if (reviewRes.rows.length === 0) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = reviewRes.rows[0];
    const isStaff = ['admin', 'manager'].includes(auth.user.role);
    const isOwner = review.user_id === auth.user.user_id;

    if (!isStaff && !isOwner) {
      return Response.json({ error: 'Access denied: You can only delete your own review' }, { status: 403 });
    }

    await query('DELETE FROM reviews WHERE review_id = $1', [reviewId]);

    return Response.json({ message: 'Review deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting review:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
