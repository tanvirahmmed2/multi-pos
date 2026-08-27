import { cookies } from 'next/headers';
import { authenticateUser } from '@/lib/auth';
import { recordActivityLog } from '@/lib/logger';

export async function POST(req) {
  try {
    const auth = await authenticateUser();
    if (auth.success && auth.user) {
      const staffId = auth.user.staff_id || auth.user.user_id;
      await recordActivityLog(req, {
        staffId,
        action: 'STAFF_LOGOUT',
        entity: 'staffs',
        entityId: staffId,
        details: `Staff member ${auth.user.name || auth.user.email} signed out`
      });
    }

    const cookieStore = await cookies();
    cookieStore.set('ecom_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    });

    return Response.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
