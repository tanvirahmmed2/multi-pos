import { query } from '@/lib/db';
import { authenticateStaff } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const staffId = auth.staff.staff_id;
    const currentToken = auth.staff.current_session_token || '';

    const result = await query(
      `SELECT session_id, user_agent, ip_address, device_info, last_active, created_at, 
              (session_token = $1) as is_current_device
       FROM staff_sessions 
       WHERE staff_id = $2 
       ORDER BY (session_token = $1) DESC, last_active DESC`,
      [currentToken, staffId]
    );

    return Response.json({ sessions: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching staff sessions:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const staffId = auth.staff.staff_id;
    const currentToken = auth.staff.current_session_token || '';

    // Revoke all OTHER sessions for this staff
    await query(
      `DELETE FROM staff_sessions WHERE staff_id = $1 AND session_token != $2`,
      [staffId, currentToken]
    );

    return Response.json(
      { message: 'Logged out from all other devices successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error logging out from all other devices:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
