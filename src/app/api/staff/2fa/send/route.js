import { query } from '@/lib/db';
import { authenticateStaff } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { STORE_NAME } from '@/lib/secret';

export async function POST(req) {
  try {
    const auth = await authenticateStaff();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 401 });
    }

    const staffId = auth.staff.staff_id;
    const staffEmail = auth.staff.email;
    const staffName = auth.staff.name;

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP code and expiration (10 minutes)
    await query(
      `UPDATE staffs 
       SET "2fa_code" = $1, "2fa_expires_at" = NOW() + INTERVAL '10 minutes' 
       WHERE staff_id = $2`,
      [otpCode, staffId]
    );

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; font-size: 20px; font-weight: bold; margin-bottom: 8px;">${STORE_NAME} Security Verification</h2>
        <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">Hi ${staffName},</p>
        <p style="color: #475569; font-size: 14px;">Your 2FA security verification code is:</p>
        <div style="background-color: #f1f5f9; text-align: center; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a; margin: 20px 0;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes. If you did not request this verification code, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: staffEmail,
        subject: `[${STORE_NAME}] Your 2FA Verification Code`,
        htmlContent: mailHtml,
      });
    } catch (emailErr) {
      console.error('Failed to send 2FA email via Brevo:', emailErr);
    }

    return Response.json(
      { message: `Verification code sent to ${staffEmail}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
