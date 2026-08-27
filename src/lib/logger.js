import { query } from '@/lib/db';

export function getClientIp(req) {
  if (!req) return '127.0.0.1';
  try {
    const xForwardedFor = req.headers?.get ? req.headers.get('x-forwarded-for') : req.headers?.['x-forwarded-for'];
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    const xRealIp = req.headers?.get ? req.headers.get('x-real-ip') : req.headers?.['x-real-ip'];
    if (xRealIp) {
      return xRealIp.trim();
    }
  } catch (err) {
    // Fallback
  }
  return '127.0.0.1';
}

export function getUserAgent(req) {
  if (!req) return 'Unknown Device';
  try {
    const ua = req.headers?.get ? req.headers.get('user-agent') : req.headers?.['user-agent'];
    return ua || 'Unknown Device';
  } catch (err) {
    return 'Unknown Device';
  }
}

export async function recordLoginLog(req, { staffId = null, email = null, role = null, status = 'success' }) {
  try {
    const ip = getClientIp(req);
    const ua = getUserAgent(req);
    await query(
      `INSERT INTO login_logs (staff_id, email, role, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [staffId, email, role, ip, ua, status]
    );
  } catch (error) {
    console.error('Failed to log login event:', error);
  }
}

export async function recordActivityLog(reqOrOptions, options = {}) {
  try {
    let req, staffId, action, entity, entityId, details;

    if (reqOrOptions && typeof reqOrOptions === 'object' && ('staffId' in reqOrOptions || 'action' in reqOrOptions)) {
      req = reqOrOptions.req;
      staffId = reqOrOptions.staffId || null;
      action = reqOrOptions.action;
      entity = reqOrOptions.entity || null;
      entityId = reqOrOptions.entityId || null;
      details = reqOrOptions.details || null;
    } else {
      req = reqOrOptions;
      const opts = options || {};
      staffId = opts.staffId || null;
      action = opts.action;
      entity = opts.entity || null;
      entityId = opts.entityId || null;
      details = opts.details || null;
    }

    const ip = getClientIp(req);
    const ua = getUserAgent(req);
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : (details ? String(details) : null);
    await query(
      `INSERT INTO activity_logs (staff_id, action, entity, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [staffId, action, entity, entityId, detailsStr, ip, ua]
    );
  } catch (error) {
    console.error('Failed to log activity event:', error);
  }
}

export const logActivity = recordActivityLog;
