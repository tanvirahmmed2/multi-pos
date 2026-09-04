import { query } from '@/lib/db';
import { authenticateStaff } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const staff = auth.staff;
    const isAdminUser = staff.role === 'admin';
    const staffBranchId = staff.branch_id;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'activity'; 
    const filterBranchId = searchParams.get('branch_id');

    let whereConditions = [];
    let params = [];

    if (!isAdminUser) {
      if (staffBranchId) {
        params.push(staffBranchId);
        whereConditions.push(`s.branch_id = $${params.length}`);
      } else {
        params.push(staff.staff_id);
        whereConditions.push(`(s.branch_id IS NULL OR al.staff_id = $${params.length})`);
      }
    } else if (filterBranchId && filterBranchId !== 'all') {
      params.push(parseInt(filterBranchId, 10));
      whereConditions.push(`s.branch_id = $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    if (type === 'login') {
      const loginWhereClause = whereClause.replace(/al\./g, 'll.');
      const sql = `
        SELECT 
          ll.*, 
          s.name AS staff_name, 
          s.email AS staff_email, 
          s.role AS staff_role,
          b.name AS branch_name
        FROM login_logs ll
        LEFT JOIN staffs s ON ll.staff_id = s.staff_id
        LEFT JOIN branches b ON s.branch_id = b.branch_id
        ${loginWhereClause}
        ORDER BY ll.log_id DESC
        LIMIT 200
      `;
      const result = await query(sql, params);
      return Response.json(result.rows, { status: 200 });
    } else {
      const sql = `
        SELECT 
          al.*, 
          s.name AS staff_name, 
          s.email AS staff_email, 
          s.role AS staff_role,
          b.name AS branch_name
        FROM activity_logs al
        LEFT JOIN staffs s ON al.staff_id = s.staff_id
        LEFT JOIN branches b ON s.branch_id = b.branch_id
        ${whereClause}
        ORDER BY al.activity_id DESC
        LIMIT 200
      `;
      const result = await query(sql, params);
      return Response.json(result.rows, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching activity/login logs:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
