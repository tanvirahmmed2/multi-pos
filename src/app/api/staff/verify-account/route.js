import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const result = await query(
      'SELECT staff_id, is_varified FROM staffs WHERE varification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    const staff = result.rows[0];

    if (staff.is_varified) {
      return Response.json({ message: 'Account is already verified!' }, { status: 200 });
    }

    await query(
      'UPDATE staffs SET is_varified = TRUE, varification_token = NULL WHERE staff_id = $1',
      [staff.staff_id]
    );

    return Response.json(
      { message: 'Staff account verified successfully! You can now log in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Staff account verification error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
