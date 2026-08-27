import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'activity'; // 'activity' or 'login'

    if (type === 'login') {
      const result = await query(`
        SELECT 
          ll.*, 
          s.name AS staff_name, 
          s.email AS staff_email, 
          s.role AS staff_role
        FROM login_logs ll
        LEFT JOIN staffs s ON ll.staff_id = s.staff_id
        ORDER BY ll.log_id DESC
        LIMIT 200
      `);
      return Response.json(result.rows, { status: 200 });
    } else {
      const result = await query(`
        SELECT 
          al.*, 
          s.name AS staff_name, 
          s.email AS staff_email, 
          s.role AS staff_role
        FROM activity_logs al
        LEFT JOIN staffs s ON al.staff_id = s.staff_id
        ORDER BY al.activity_id DESC
        LIMIT 200
      `);
      return Response.json(result.rows, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching activity/login logs:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
