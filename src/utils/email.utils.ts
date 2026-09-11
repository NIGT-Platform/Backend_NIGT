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
    const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
    const localhostUrl = `http://localhost:3000/verify-email?token=${token}`;

    await transporter.sendMail({
        from: env.emailFrom,
        to: email,
        subject: 'NIGT — Verify Your Email Address',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
          <h2 style="color: #0F1f38;">Welcome to NIGT, ${firstName}!</h2>
          <p style="color: #475569; font-size: 15px;">Please verify your email address to activate your account by clicking the button below:</p>
          <div style="margin: 25px 0;">
            <a href="${verifyUrl}" 
               style="display: inline-block; padding: 14px 28px; background: #0F1f38; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px;">This link will expire in <strong>24 hours</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 5px;"><strong>Testing on your computer?</strong> If the button above does not open on your local machine, use this link:</p>
          <p style="color: #3b82f6; font-size: 12px; word-break: break-all;"><a href="${localhostUrl}">${localhostUrl}</a></p>
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


