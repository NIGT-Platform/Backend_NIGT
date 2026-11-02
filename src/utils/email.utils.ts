import nodemailer from 'nodemailer';
import { env } from '../config/env';


const transporter = nodemailer.createTransport({
    host: env.mailtrapHost,
    port: Number(env.mailtrapPort),
    secure: Number(env.mailtrapPort) === 465, // true for 465 (Gmail), false for other ports
    auth: {
        user: env.mailtrapUser,
        pass: env.mailtrapPass,
    },
});

export const sendVerificationEmail = async (
    email: string,
    firstName: string,
    token: string
): Promise<void> => {
    const webVerifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
    const directApiUrl = `${env.appUrl}/api/auth/verify-email?token=${token}`;
    const networkApiUrl = `http://10.90.0.233:5000/api/auth/verify-email?token=${token}`;

    await transporter.sendMail({
        from: env.emailFrom,
        to: email,
        subject: 'NIGT — Verify Your Email Address',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0F1f38; margin-top: 0;">Welcome to NIGT, ${firstName}!</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Please verify your email address to activate your account.</p>
          
          <!-- Prominent Mobile App Copyable Token Box -->
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <div style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
              Verification Token (For Mobile App)
            </div>
            <div style="font-family: monospace; font-size: 17px; font-weight: bold; color: #0F1f38; letter-spacing: 1.5px; word-break: break-all; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; user-select: all;">
              ${token}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
              📱 In the NIGT mobile app, paste this token to verify immediately.
            </div>
          </div>

          <!-- One-click Verify Button -->
          <div style="margin: 24px 0; text-align: center;">
            <a href="${directApiUrl}" 
               style="display: inline-block; padding: 14px 28px; background: #0F1f38; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #64748b; font-size: 13px;">This verification token will expire in <strong>24 hours</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 6px;"><strong>Alternative Links:</strong></p>
          <ul style="color: #3b82f6; font-size: 12px; padding-left: 20px; line-height: 1.8; word-break: break-all;">
            <li><a href="${webVerifyUrl}" style="color: #3b82f6;">Web App Verification (${webVerifyUrl})</a></li>
            <li><a href="${networkApiUrl}" style="color: #3b82f6;">Mobile Direct Link (${networkApiUrl})</a></li>
          </ul>
          <p style="color: #94a3b8; font-size: 12px;">If you did not create this account, please ignore this email.</p>
        </div>
        `,
    });
};

export const sendPasswordResetEmail = async (
    email: string,
    firstName: string,
    token: string
): Promise<void> => {
    const resetUrl =
        `${env.clientUrl}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: env.emailFrom,
        to: email,
        subject: 'NIGT — Reset Your Password',
        html: `
      <h2>Hi ${firstName},</h2>
      <p>You requested to reset your password. Click the link below:</p>
      <a href="${resetUrl}" style="padding:10px 20px;background:#e53935;color:white;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
      <p>This link expires in <strong>1 hour</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
    });
};


