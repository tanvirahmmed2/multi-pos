import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { hashPassword, comparePassword, verifyToken, authenticateStaff } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { getBaseUrl, STORE_NAME } from '@/lib/secret';
import crypto from 'crypto';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ecom_token')?.value;

    if (!token) {
      return Response.json({ staff: null, user: null }, { status: 200 });
    }

    const decoded = verifyToken(token);
    const staffId = decoded?.staff_id || decoded?.user_id;
    if (!decoded || !staffId) {
      return Response.json({ staff: null, user: null }, { status: 200 });
    }

    const result = await query(
      'SELECT staff_id, branch_id, name, email, phone, role, is_active, is_varified, is_banned, created_at, updated_at FROM staffs WHERE staff_id = $1',
      [staffId]
    );

    if (result.rows.length === 0) {
      return Response.json({ staff: null, user: null }, { status: 200 });
    }

    const staff = result.rows[0];
    if (staff.is_banned) {
      return Response.json({ error: 'Account is banned' }, { status: 403 });
    }
    if (!staff.is_active) {
      return Response.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const responseStaff = { ...staff, user_id: staff.staff_id };

    return Response.json({ staff: responseStaff, user: responseStaff }, { status: 200 });
  } catch (error) {
    console.error('Error fetching current staff:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, email, phone, password, role, branch_id } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const checkStaff = await query('SELECT staff_id FROM staffs WHERE email = $1', [email.trim().toLowerCase()]);
    if (checkStaff.rows.length > 0) {
      return Response.json({ error: 'Email is already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const validRole = role && ['admin', 'manager', 'sales', 'staff'].includes(role) ? role : 'staff';
    const branchIdVal = branch_id ? parseInt(branch_id, 10) : null;

    const result = await query(
      `INSERT INTO staffs (branch_id, name, email, phone, password, role, varification_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING staff_id, branch_id, name, email, phone, role, is_active, is_varified, is_banned, created_at`,
      [branchIdVal, name.trim(), email.trim().toLowerCase(), phone || null, hashedPassword, validRole, verificationToken]
    );

    const newStaff = result.rows[0];

    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      const checkCust = await query('SELECT customer_id FROM customers WHERE phone = $1', [cleanPhone]);
      if (checkCust.rows.length > 0) {
        await query(
          `UPDATE customers SET name = $1, email = $2 WHERE phone = $3`,
          [name.trim(), email.trim(), cleanPhone]
        );
      } else {
        await query(
          `INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3)`,
          [name.trim(), email.trim(), cleanPhone]
        );
      }
    }

    const baseUrl = getBaseUrl(req);
    const verificationLink = `${baseUrl}/verify-account?token=${verificationToken}`;
    const mailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center;">Welcome to ${STORE_NAME}!</h2>
        <p>Hi ${name},</p>
        <p>Your staff account has been created. Please verify your email address to activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Account</a>
        </div>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #64748b;">${verificationLink}</p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: `Verify your ${STORE_NAME} Staff Account`,
        htmlContent: mailContent,
      });
    } catch (mailError) {
      console.error('Failed to send verification email:', mailError);
    }

    const responseStaff = { ...newStaff, user_id: newStaff.staff_id };
    return Response.json(
      { message: 'Staff registered successfully! Verification email sent.', staff: responseStaff, user: responseStaff },
      { status: 201 }
    );
  } catch (error) {
    console.error('Staff registration error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const { name, email, phone, currentPassword, newPassword } = await req.json();

    if (!name || !name.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const checkEmail = await query('SELECT staff_id FROM staffs WHERE email = $1 AND staff_id != $2', [email.trim(), auth.staff.staff_id]);
    if (checkEmail.rows.length > 0) {
      return Response.json({ error: 'Email address is already in use by another staff member' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.trim() : null;
    let passwordHashToSave = null;

    if (newPassword && newPassword.trim()) {
      if (!currentPassword) {
        return Response.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }

      const staffRes = await query('SELECT password FROM staffs WHERE staff_id = $1', [auth.staff.staff_id]);
      if (staffRes.rows.length === 0) {
        return Response.json({ error: 'Staff record not found' }, { status: 404 });
      }

      const match = await comparePassword(currentPassword, staffRes.rows[0].password);
      if (!match) {
        return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      passwordHashToSave = await hashPassword(newPassword.trim());
    }

    let result;
    if (passwordHashToSave) {
      result = await query(
        `UPDATE staffs 
         SET name = $1, email = $2, phone = $3, password = $4, updated_at = NOW() 
         WHERE staff_id = $5 
         RETURNING staff_id, branch_id, name, email, phone, role, is_active, is_varified, is_banned, created_at, updated_at`,
        [name.trim(), email.trim(), cleanPhone, passwordHashToSave, auth.staff.staff_id]
      );
    } else {
      result = await query(
        `UPDATE staffs 
         SET name = $1, email = $2, phone = $3, updated_at = NOW() 
         WHERE staff_id = $4 
         RETURNING staff_id, branch_id, name, email, phone, role, is_active, is_varified, is_banned, created_at, updated_at`,
        [name.trim(), email.trim(), cleanPhone, auth.staff.staff_id]
      );
    }

    const updatedStaff = { ...result.rows[0], user_id: result.rows[0].staff_id };

    return Response.json({ message: 'Profile updated successfully', staff: updatedStaff, user: updatedStaff }, { status: 200 });
  } catch (error) {
    console.error('Staff profile update error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    await query('DELETE FROM staffs WHERE staff_id = $1', [auth.staff.staff_id]);

    const cookieStore = await cookies();
    cookieStore.set('ecom_token', '', { expires: new Date(0), path: '/' });

    return Response.json({ message: 'Account deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Staff account deletion error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
