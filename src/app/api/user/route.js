import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { hashPassword, comparePassword, verifyToken, authenticateUser } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { getBaseUrl, STORE_NAME } from '@/lib/secret';
import crypto from 'crypto';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ecom_token')?.value;

    if (!token) {
      return Response.json({ user: null }, { status: 200 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.user_id) {
      return Response.json({ user: null }, { status: 200 });
    }

    const result = await query(
      'SELECT user_id, name, email, phone, role, is_active, is_varified, is_banned, created_at, updated_at FROM users WHERE user_id = $1',
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      return Response.json({ user: null }, { status: 200 });
    }

    const user = result.rows[0];
    if (user.is_banned) {
      return Response.json({ error: 'Account is banned' }, { status: 403 });
    }
    if (!user.is_active) {
      return Response.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    return Response.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const checkUser = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return Response.json({ error: 'Email is already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert user (raw PostgreSQL query)
    const result = await query(
      `INSERT INTO users (name, email, phone, password, varification_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, email`,
      [name, email, phone || null, hashedPassword, verificationToken]
    );

    const newUser = result.rows[0];

    // Create or update customer profile based on phone number
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      const checkCust = await query('SELECT customer_id FROM customers WHERE phone = $1', [cleanPhone]);
      if (checkCust.rows.length > 0) {
        await query(
          `UPDATE customers 
           SET name = $1, email = $2 
           WHERE phone = $3`,
          [name.trim(), email.trim(), cleanPhone]
        );
      } else {
        await query(
          `INSERT INTO customers (name, email, phone) 
           VALUES ($1, $2, $3)`,
          [name.trim(), email.trim(), cleanPhone]
        );
      }
    }

    // Send verification email via Brevo
    const baseUrl = getBaseUrl(req);
    const verificationLink = `${baseUrl}/verify-account?token=${verificationToken}`;
    const mailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center;">Welcome to Ecom!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering. Please verify your email address to activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Account</a>
        </div>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #64748b;">${verificationLink}</p>
        <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8;">
          This link will expire in 24 hours. If you did not register for an account, please ignore this email.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: `Verify your ${STORE_NAME} Account`,
        htmlContent: mailContent,
      });
    } catch (mailError) {
      console.error('Failed to send verification email:', mailError);
      // We still registered the user, but inform them about verification issue or return success
    }

    return Response.json(
      { message: 'Registration successful! Please check your email to verify your account.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await authenticateUser();
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

    // Check if email is already taken by another user
    const checkEmail = await query('SELECT user_id FROM users WHERE email = $1 AND user_id != $2', [email.trim(), auth.user.user_id]);
    if (checkEmail.rows.length > 0) {
      return Response.json({ error: 'Email address is already in use by another user' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.trim() : null;
    let passwordHashToSave = null;

    // Handle password change if requested
    if (newPassword && newPassword.trim()) {
      if (!currentPassword) {
        return Response.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }

      // Fetch user's stored password hash
      const userRes = await query('SELECT password FROM users WHERE user_id = $1', [auth.user.user_id]);
      if (userRes.rows.length === 0) {
        return Response.json({ error: 'User record not found' }, { status: 404 });
      }

      const match = await comparePassword(currentPassword, userRes.rows[0].password);
      if (!match) {
        return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      passwordHashToSave = await hashPassword(newPassword.trim());
    }

    // Update user details in database
    let result;
    if (passwordHashToSave) {
      result = await query(
        `UPDATE users 
         SET name = $1, email = $2, phone = $3, password = $4, updated_at = NOW() 
         WHERE user_id = $5 
         RETURNING user_id, name, email, phone, role, is_active, is_varified, is_banned, created_at, updated_at`,
        [name.trim(), email.trim(), cleanPhone, passwordHashToSave, auth.user.user_id]
      );
    } else {
      result = await query(
        `UPDATE users 
         SET name = $1, email = $2, phone = $3, updated_at = NOW() 
         WHERE user_id = $4 
         RETURNING user_id, name, email, phone, role, is_active, is_varified, is_banned, created_at, updated_at`,
        [name.trim(), email.trim(), cleanPhone, auth.user.user_id]
      );
    }

    const updatedUser = result.rows[0];

    // Synchronize customer profile
    if (cleanPhone) {
      const checkCust = await query('SELECT customer_id FROM customers WHERE phone = $1', [cleanPhone]);
      if (checkCust.rows.length > 0) {
        await query(
          `UPDATE customers 
           SET name = $1, email = $2 
           WHERE phone = $3`,
          [name.trim(), email.trim(), cleanPhone]
        );
      } else {
        await query(
          `INSERT INTO customers (name, email, phone) 
           VALUES ($1, $2, $3)`,
          [name.trim(), email.trim(), cleanPhone]
        );
      }
    }

    return Response.json({ message: 'Profile settings updated successfully', user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error('Settings update error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await authenticateUser();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    // Delete user from database (PostgreSQL handles cascading & nullifying foreign keys)
    await query('DELETE FROM users WHERE user_id = $1', [auth.user.user_id]);

    // Clear authentication cookie
    const cookieStore = await cookies();
    cookieStore.set('ecom_token', '', { expires: new Date(0), path: '/' });

    return Response.json({ message: 'Your account has been deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Account deletion error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
