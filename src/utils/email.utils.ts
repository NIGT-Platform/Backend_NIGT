import nodemailer from 'nodemailer';
import { env } from '../config/env';


const transporter = nodemailer.createTransport({
    host: env.mailtrapHost,
    port: env.mailtrapPort,
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
    const verifyUrl =
        `${env.appUrl}/api/auth/verify-email?token=${token}`;

    await transporter.sendMail({
        from: env.emailFrom,
        to: email,
        subject: 'NIGT — Verify Your Email Address',
        html: `<h2>Welcome to NIGT, ${firstName}!</h2>
        <p> Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" 
        style="padding:10px 20px;background:#1a73e8;color:white;text-decoration:none;border-radius:5px;">${verifyUrl}</a>
        <p>This link expires in <strong>24 hours</strong>.</p>
      <p>If you did not register, please ignore this email.</p> 
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


