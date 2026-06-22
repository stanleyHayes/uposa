import { Resend } from 'resend';
import { env } from '../config/env';

// Construct the Resend client lazily so importing this module never throws when
// RESEND_API_KEY is absent (e.g. CI test/e2e environments that don't send mail).
// The key is only required when an email is actually sent.
let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await getResend().emails.send({
    from: env.FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

// ── Brand tokens ──
const NAVY = '#0a1633';
const GOLD = '#e3b341';
const CREAM = '#faf7ef';

const firstNameOf = (name: string) => (name?.trim().split(/\s+/)[0] || 'there');

/**
 * Branded, email-client-safe HTML shell (tables + inline styles) used by every
 * transactional email so they share one warm, on-brand look.
 */
function renderBrandedEmail(opts: {
  preheader: string;
  heading: string;
  intro: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
}): string {
  const { preheader, heading, intro, bodyHtml = '', ctaLabel, ctaUrl, footnote } = opts;
  const cta = ctaUrl && ctaLabel
    ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
              <tr><td style="background:${NAVY};">
                <a href="${ctaUrl}" style="display:inline-block;padding:15px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:${CREAM};text-decoration:none;letter-spacing:0.3px;">${ctaLabel} &nbsp;&rarr;</a>
              </td></tr>
            </table>
            <p style="margin:14px 0 4px;font-size:12px;color:#8893a4;">Or paste this link into your browser:</p>
            <p style="margin:0;font-size:12px;word-break:break-all;"><a href="${ctaUrl}" style="color:#2b6cb0;">${ctaUrl}</a></p>`
    : '';
  const note = footnote
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8893a4;">${footnote}</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="x-apple-disable-message-reformatting" /></head>
<body style="margin:0;padding:0;background:#eef0f4;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;box-shadow:0 12px 44px rgba(10,22,51,0.12);">
        <tr><td style="background:${NAVY};padding:36px 40px 30px;">
          <div style="font-family:Georgia,'Times New Roman',serif;color:${GOLD};font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;">&#9632; The Legit Elites</div>
          <div style="font-family:Georgia,'Times New Roman',serif;color:${CREAM};font-size:42px;font-weight:bold;letter-spacing:2px;margin-top:8px;line-height:1;">UPOSA</div>
          <div style="font-family:Arial,Helvetica,sans-serif;color:rgba(250,247,239,0.72);font-size:13px;margin-top:8px;">University Practice Old Students' Association</div>
        </td></tr>
        <tr><td style="height:4px;background:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:40px;font-family:Arial,Helvetica,sans-serif;color:#26303f;">
          <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;color:${NAVY};font-size:25px;line-height:1.25;">${heading}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3a4658;">${intro}</p>
          ${bodyHtml}${cta}${note}
        </td></tr>
        <tr><td style="background:#f6f7f9;padding:24px 40px;border-top:1px solid #e6e9ef;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0;font-size:12px;color:#8893a4;line-height:1.6;">UPOSA &mdash; University Practice Old Students' Association<br/>The official alumni network of University Practice Senior High School.</p>
          <p style="margin:10px 0 0;font-size:12px;"><a href="https://uposa.org" style="color:#2b6cb0;text-decoration:none;">uposa.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
  const url = `${env.CLIENT_URL}/verify-email/${token}`;
  const first = firstNameOf(name);
  await sendEmail({
    to: email,
    subject: `Welcome to UPOSA, ${first} — confirm your email`,
    html: renderBrandedEmail({
      preheader: 'Confirm your email to activate your UPOSA alumni account.',
      heading: `Welcome to the family, ${first}! 🎓`,
      intro: `We're truly glad to have you join <strong>UPOSA</strong> — the home of University Practice's old students. You're one step away from reconnecting with fellow alumni, tracking your dues, joining projects, and celebrating the legacy we all share.`,
      bodyHtml: `<p style="margin:0 0 4px;font-size:15px;line-height:1.65;color:#3a4658;">Just confirm your email address to activate your account:</p>`,
      ctaLabel: 'Confirm my email',
      ctaUrl: url,
      footnote: `This link expires in 24 hours. If you didn't create a UPOSA account, you can safely ignore this email — nothing will happen.`,
    }),
  });
}

export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
  const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
  const first = firstNameOf(name);
  await sendEmail({
    to: email,
    subject: 'Reset your UPOSA password',
    html: renderBrandedEmail({
      preheader: 'Reset your UPOSA account password.',
      heading: 'Reset your password',
      intro: `Hello ${first}, we received a request to reset the password for your UPOSA account. Click below to choose a new one.`,
      ctaLabel: 'Reset my password',
      ctaUrl: url,
      footnote: `This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email — your password won't change.`,
    }),
  });
}

export async function sendApprovalEmail(email: string, name: string): Promise<void> {
  const url = `${env.CLIENT_URL}/login`;
  const first = firstNameOf(name);
  await sendEmail({
    to: email,
    subject: 'Your UPOSA membership has been approved! 🎉',
    html: renderBrandedEmail({
      preheader: 'Your UPOSA membership is approved — log in to get started.',
      heading: `You're in, ${first}! 🎉`,
      intro: `Wonderful news — your UPOSA membership has been <strong>approved</strong>. You now have full access to the alumni portal: the member directory, dues, mentorship, projects, events, and the community forum.`,
      ctaLabel: 'Log in to the portal',
      ctaUrl: url,
      footnote: `We're so glad to welcome you into the community. Once an Elite, always an Elite.`,
    }),
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const first = firstNameOf(name);
  await sendEmail({
    to: email,
    subject: 'Welcome to UPOSA!',
    html: renderBrandedEmail({
      preheader: 'Thanks for registering with UPOSA — your membership is under review.',
      heading: `Welcome aboard, ${first}!`,
      intro: `Thank you for registering with <strong>UPOSA</strong>. Your membership is currently under review by our team — we'll email you the moment it's approved so you can dive into the alumni portal.`,
      bodyHtml: `<p style="margin:0;font-size:15px;line-height:1.65;color:#3a4658;">In the meantime, feel free to explore our public resources and stay connected with the community.</p>`,
      ctaLabel: 'Explore UPOSA',
      ctaUrl: 'https://uposa.org',
      footnote: `We're excited to have you with us — welcome to the family.`,
    }),
  });
}
