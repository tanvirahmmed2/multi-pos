import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { authenticateStaff } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const staffId = auth.staff.staff_id;

    // Check if session exists and belongs to this staff
    const checkRes = await query(
      `SELECT session_id, session_token FROM staff_sessions WHERE session_id = $1 AND staff_id = $2`,
      [sessionId, staffId]
    );

    if (checkRes.rows.length === 0) {
      return Response.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    const sessionObj = checkRes.rows[0];
    const isCurrentSession = sessionObj.session_token === auth.staff.current_session_token;

    // Delete session from DB
    await query(`DELETE FROM staff_sessions WHERE session_id = $1`, [sessionId]);

    // If revoking current device session, clear cookie
    if (isCurrentSession) {
      const cookieStore = await cookies();
      cookieStore.set('ecom_token', '', { expires: new Date(0), path: '/' });
    }

    return Response.json(
      { 
        message: 'Device session logged out successfully', 
        is_current_device: isCurrentSession 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error revoking device session:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
