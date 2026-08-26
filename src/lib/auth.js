import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query } from './db';
import { JWT_SECRET } from './secret';


export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}


export const authenticateStaff = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ecom_token')?.value;

    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const decoded = verifyToken(token);
    const staffId = decoded?.staff_id || decoded?.user_id;
    if (!decoded || !staffId) {
      return { success: false, message: 'Invalid or expired token' };
    }

    const result = await query(
      'SELECT staff_id, branch_id, name, email, phone, role, is_active, is_banned FROM staffs WHERE staff_id = $1',
      [staffId]
    );

    if (result.rows.length === 0) {
      return { success: false, message: 'Staff member not found' };
    }

    const staff = result.rows[0];
    if (staff.is_banned) {
      return { success: false, message: 'Staff account is banned' };
    }
    if (!staff.is_active) {
      return { success: false, message: 'Staff account is deactivated' };
    }

    return { success: true, staff, user: staff };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const authenticateUser = authenticateStaff;

export const isStaff = async () => {
  const auth = await authenticateStaff();
  if (!auth.success) return auth;
  return { success: true, staff: auth.staff, user: auth.staff };
};

export const isUser = isStaff;

export const isAdmin = async () => {
  const auth = await authenticateStaff();
  if (!auth.success) return auth;
  if (auth.staff.role !== 'admin') {
    return { success: false, message: 'Access denied: Admin role required' };
  }
  return { success: true, staff: auth.staff, user: auth.staff };
};

export const isManager = async () => {
  const auth = await authenticateStaff();
  if (!auth.success) return auth;
  if (auth.staff.role !== 'manager') {
    return { success: false, message: 'Access denied: Manager role required' };
  }
  return { success: true, staff: auth.staff, user: auth.staff };
};

export const isSales = async () => {
  const auth = await authenticateStaff();
  if (!auth.success) return auth;
  if (auth.staff.role !== 'sales') {
    return { success: false, message: 'Access denied: Sales role required' };
  }
  return { success: true, staff: auth.staff, user: auth.staff };
};

export const isManagementRole = async () => {
  const auth = await authenticateStaff();
  if (!auth.success) return auth;
  if (auth.staff.role !== 'manager' && auth.staff.role !== 'admin' && auth.staff.role !== 'sales') {
    return { success: false, message: 'Access denied: Management role required' };
  }
  return { success: true, staff: auth.staff, user: auth.staff };
};

export const isManagerOrAdmin = async () => {
  const auth = await authenticateStaff();
  if (!auth.success) return auth;
  if (auth.staff.role !== 'manager' && auth.staff.role !== 'admin') {
    return { success: false, message: 'Access denied: Admin or Manager role required' };
  }
  return { success: true, staff: auth.staff, user: auth.staff };
};

