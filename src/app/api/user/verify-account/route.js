import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Query user by verification token (raw PostgreSQL query)
    const result = await query(
      'SELECT user_id, is_varified FROM users WHERE varification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    const user = result.rows[0];

    if (user.is_varified) {
      return Response.json({ message: 'Account is already verified!' }, { status: 200 });
    }

    // Update user to verified status (raw PostgreSQL query)
    await query(
      'UPDATE users SET is_varified = TRUE, varification_token = NULL WHERE user_id = $1',
      [user.user_id]
    );

    return Response.json(
      { message: 'Account verified successfully! You can now log in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Account verification error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
