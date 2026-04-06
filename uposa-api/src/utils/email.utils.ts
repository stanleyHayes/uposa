import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export async function sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
  const url = `${env.CLIENT_URL}/verify-email/${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your UPOSA account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Welcome to UPOSA, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address to complete your registration.</p>
        <p>
          <a href="${url}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this link: <a href="${url}">${url}</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">UPOSA - University Practice Old Students Association</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
  const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your UPOSA password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your UPOSA account password.</p>
        <p>
          <a href="${url}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link: <a href="${url}">${url}</a></p>
        <p>This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">UPOSA - University Practice Old Students Association</p>
      </div>
    `,
  });
}

export async function sendApprovalEmail(email: string, name: string): Promise<void> {
  const url = `${env.CLIENT_URL}/login`;
  await sendEmail({
    to: email,
    subject: 'Your UPOSA membership has been approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Membership Approved!</h2>
        <p>Hello ${name},</p>
        <p>Congratulations! Your UPOSA membership has been approved. You can now log in to access all member features.</p>
        <p>
          <a href="${url}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Log In Now
          </a>
        </p>
        <p>We're excited to have you as part of the UPOSA community!</p>
        <hr />
        <p style="color: #666; font-size: 12px;">UPOSA - University Practice Old Students Association</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to UPOSA!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Welcome to UPOSA!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with UPOSA. Your account is currently under review.
        You will receive an email once your membership has been approved.</p>
        <p>In the meantime, feel free to explore our public resources.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">UPOSA - University Practice Old Students Association</p>
      </div>
    `,
  });
}
