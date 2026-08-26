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


export const authenticateUser = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ecom_token')?.value;

    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.user_id) {
      return { success: false, message: 'Invalid or expired token' };
    }

    const result = await query(
      'SELECT user_id, name, email, phone, role, is_active, is_banned FROM users WHERE user_id = $1',
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = result.rows[0];
    if (user.is_banned) {
      return { success: false, message: 'User account is banned' };
    }
    if (!user.is_active) {
      return { success: false, message: 'User account is deactivated' };
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, message: error.message };
  }
};


export const isUser = async () => {
  const auth = await authenticateUser();
  if (!auth.success) return auth;
  return { success: true, user: auth.user };
};


export const isAdmin = async () => {
  const auth = await authenticateUser();
  if (!auth.success) return auth;
  if (auth.user.role !== 'admin') {
    return { success: false, message: 'Access denied: Admin role required' };
  }
  return { success: true, user: auth.user };
};


export const isManager = async () => {
  const auth = await authenticateUser();
  if (!auth.success) return auth;
  if (auth.user.role !== 'manager') {
    return { success: false, message: 'Access denied: Manager role required' };
  }
  return { success: true, user: auth.user };
};


export const isSales = async () => {
  const auth = await authenticateUser();
  if (!auth.success) return auth;
  if (auth.user.role !== 'sales') {
    return { success: false, message: 'Access denied: Sales role required' };
  }
  return { success: true, user: auth.user };
};

export const isManagementRole = async () => {
  const auth = await authenticateUser();
  if (!auth.success) return auth;
  if (auth.user.role !== 'manager' && auth.user.role !== 'admin' && auth.user.role!=='sales') {
    return { success: false, message: 'Access denied: Management role required' };
  }
  return { success: true, user: auth.user };
};
