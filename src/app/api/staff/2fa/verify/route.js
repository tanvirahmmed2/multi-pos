import { query } from '@/lib/db';
import { authenticateStaff } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const { code, enable } = await req.json();

    if (!code || !code.trim()) {
      return Response.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const staffId = auth.staff.staff_id;
    const cleanCode = code.trim();

    const staffRes = await query(
      `SELECT "2fa_code", ("2fa_expires_at" > NOW()) as is_not_expired FROM staffs WHERE staff_id = $1`,
      [staffId]
    );

    if (staffRes.rows.length === 0) {
      return Response.json({ error: 'Staff account not found' }, { status: 404 });
    }

    const staffData = staffRes.rows[0];
    const twoFaCode = staffData['2fa_code'];
    const isNotExpired = Boolean(staffData.is_not_expired);

    if (!twoFaCode || twoFaCode !== cleanCode) {
      return Response.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (!isNotExpired) {
      return Response.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
    }

    const isEnable = Boolean(enable);

    // Update 2fa_active and clear OTP fields
    const updateRes = await query(
      `UPDATE staffs 
       SET "2fa_active" = $1, "2fa_code" = NULL, "2fa_expires_at" = NULL, updated_at = NOW() 
       WHERE staff_id = $2 
       RETURNING staff_id, branch_id, name, email, phone, role, is_active, is_varified, is_banned, "2fa_active", created_at, updated_at`,
      [isEnable, staffId]
    );

    const updatedStaff = { ...updateRes.rows[0], user_id: updateRes.rows[0].staff_id };

    return Response.json(
      { 
        message: `Two-Factor Authentication ${isEnable ? 'enabled' : 'disabled'} successfully!`, 
        staff: updatedStaff, 
        user: updatedStaff 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
