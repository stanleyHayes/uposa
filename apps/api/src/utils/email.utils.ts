import crypto from 'crypto';
import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { emailLink, escapeHtml, renderEmail, SITE_URL, type EmailContent } from './email-layout';

export { escapeHtml } from './email-layout';

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
  text?: string;
  /** Where replies go; defaults to the association desk (mail is sent from a no-reply address). */
  replyTo?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await getResend().emails.send({
    from: env.FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.text ? { text: options.text } : {}),
    replyTo: options.replyTo || env.REPLY_TO_EMAIL,
    ...(options.headers ? { headers: options.headers } : {}),
  });
}

/** A built email: subject + branded HTML + plain-text alternative. */
export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

function build(subject: string, content: EmailContent): BuiltEmail {
  return { subject, ...renderEmail(content) };
}

/**
 * Fire-and-forget for notifications that must never fail the request that
 * triggered them (receipts, acknowledgements). Failures are logged.
 */
export function sendInBackground(to: string | null | undefined, email: BuiltEmail, context: string, replyTo?: string): void {
  if (!to || !/@/.test(to) || to.endsWith('.invalid')) return;
  sendEmail({ to, ...email, replyTo }).catch((err: unknown) =>
    logger.warn({ context, err: (err as Error)?.message }, 'Email could not be sent'));
}

const firstNameOf = (name: string) => (name?.trim().split(/\s+/)[0] || 'there');

const formatMoney = (amount: number, currency = 'GHS') => {
  const value = Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency.toUpperCase() === 'GHS' ? `GH₵ ${value}` : `${currency.toUpperCase()} ${value}`;
};

const formatDate = (value: Date | string | number = new Date()) =>
  new Date(value).toLocaleDateString('en-GB', { timeZone: 'Africa/Accra', day: 'numeric', month: 'long', year: 'numeric' });

// ── Marketing / newsletter email ──
// Transactional mail (verification, resets, receipts, approvals) uses sendEmail.
// Anything promotional or bulk MUST go through sendMarketingEmail, to recipients
// from getMarketingRecipients() (modules/newsletter/newsletter.service.ts).

/** Stateless unsubscribe token: HMAC of the normalised email (no DB lookup, can't be forged). */
export function newsletterUnsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', `newsletter-unsubscribe:${env.JWT_SECRET}`)
    .update(email.trim().toLowerCase())
    .digest('hex');
}

export function isValidUnsubscribeToken(email: string, token: string): boolean {
  const expected = Buffer.from(newsletterUnsubscribeToken(email), 'utf8');
  const received = Buffer.from(String(token || ''), 'utf8');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function newsletterUnsubscribeUrl(email: string): string {
  const params = new URLSearchParams({ email: email.trim().toLowerCase(), token: newsletterUnsubscribeToken(email) });
  return `${env.API_PUBLIC_URL}/api/newsletter/unsubscribe?${params.toString()}`;
}

export interface MarketingEmailInput {
  subject: string;
  preheader: string;
  heading: string;
  /** Paragraphs of trusted HTML (escape any interpolated values). */
  paragraphs: string[];
  button?: { label: string; url: string };
}

export function buildMarketingEmail(to: string, input: MarketingEmailInput): BuiltEmail {
  return build(input.subject, {
    audience: 'marketing',
    preheader: input.preheader,
    heading: escapeHtml(input.heading),
    paragraphs: input.paragraphs,
    button: input.button,
    unsubscribeUrl: newsletterUnsubscribeUrl(to),
  });
}

/**
 * Send a non-transactional email in the branded layout. It always carries an
 * unsubscribe link in the footer plus RFC 8058 one-click List-Unsubscribe
 * headers (required by Gmail/Yahoo for bulk senders).
 */
export async function sendMarketingEmail(to: string, input: MarketingEmailInput): Promise<void> {
  const unsubscribeUrl = newsletterUnsubscribeUrl(to);
  await sendEmail({
    to,
    ...buildMarketingEmail(to, input),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}

// ── Account emails ──

export function buildVerificationEmail(token: string, name: string): BuiltEmail {
  const first = escapeHtml(firstNameOf(name));
  return build(`Welcome to UPOSA, ${firstNameOf(name)}: confirm your email`, {
    audience: 'member',
    preheader: 'Confirm your email to activate your UPOSA alumni account.',
    heading: `Welcome to the family, ${first}!`,
    paragraphs: [
      `We're glad you've joined <strong>UPOSA</strong>, the home of University Practice's old students. Please confirm your email address to activate your account.`,
    ],
    button: { label: 'Confirm my email', url: `${env.CLIENT_URL}/verify-email/${encodeURIComponent(token)}` },
    closing: [
      `<strong>What happens next?</strong> Once your email is confirmed, the association reviews your registration. We'll email you as soon as you're approved, and then you can use the directory, pay dues, join projects and take part in the community.`,
    ],
    footnote: `This link expires in 24 hours. If you didn't create a UPOSA account, you can ignore this email.`,
  });
}

export function buildPasswordResetEmail(token: string, name: string): BuiltEmail {
  const first = escapeHtml(firstNameOf(name));
  return build('Reset your UPOSA password', {
    audience: 'member',
    preheader: 'Use this link to choose a new UPOSA password.',
    heading: 'Reset your password',
    paragraphs: [`Hello ${first}, we received a request to reset the password for your UPOSA account. Choose a new one below.`],
    button: { label: 'Reset my password', url: `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}` },
    footnote: `This link expires in 1 hour and can be used once. If you didn't ask for a reset, you can ignore this email; your password won't change.`,
  });
}

export function buildAdminPasswordResetEmail(resetUrl: string, name: string): BuiltEmail {
  const first = escapeHtml(firstNameOf(name));
  return build('Reset your UPOSA admin password', {
    audience: 'staff',
    preheader: 'Use this link to choose a new UPOSA admin password.',
    heading: 'Reset your admin password',
    paragraphs: [`Hello ${first}, we received a request to reset the password for your UPOSA admin account. Choose a new one below.`],
    button: { label: 'Reset my password', url: resetUrl },
    footnote: `This link expires in 1 hour and can be used once. If you didn't ask for a reset, ignore this email and consider telling the other administrators.`,
  });
}

export function buildApprovalEmail(name: string): BuiltEmail {
  const first = escapeHtml(firstNameOf(name));
  return build('Your UPOSA membership has been approved', {
    audience: 'member',
    preheader: 'Your UPOSA membership is approved. Sign in to get started.',
    heading: `You're in, ${first}!`,
    paragraphs: [
      `Good news: your UPOSA membership has been <strong>approved</strong>. You now have full access to the member portal, including the directory, dues, mentorship, projects, events and the community forum.`,
    ],
    button: { label: 'Sign in to the portal', url: `${env.CLIENT_URL}/login` },
    closing: [`Welcome to the community. Once an Elite, always an Elite.`],
  });
}

export async function sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
  await sendEmail({ to: email, ...buildVerificationEmail(token, name) });
}

export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
  await sendEmail({ to: email, ...buildPasswordResetEmail(token, name) });
}

export async function sendAdminPasswordResetEmail(email: string, resetUrl: string, name: string): Promise<void> {
  await sendEmail({ to: email, ...buildAdminPasswordResetEmail(resetUrl, name) });
}

export async function sendApprovalEmail(email: string, name: string): Promise<void> {
  await sendEmail({ to: email, ...buildApprovalEmail(name) });
}

// ── Contact desk ──

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function buildContactNotification(data: ContactMessageInput): BuiltEmail {
  return build(`[UPOSA Contact] ${data.subject}`, {
    audience: 'staff',
    preheader: `${data.name}: ${data.subject}`,
    heading: 'New contact message',
    paragraphs: [`<strong>${escapeHtml(data.name)}</strong> sent a message through the website. Reply to this email to answer them directly.`],
    details: {
      rows: [
        ['From', `${data.name} <${data.email}>`],
        ['Subject', data.subject],
        ['Message', data.message],
      ],
    },
    button: { label: 'Open in admin', url: `${env.ADMIN_URL}/contact-messages` },
  });
}

export function buildContactAcknowledgement(data: ContactMessageInput): BuiltEmail {
  const first = escapeHtml(firstNameOf(data.name));
  return build('We received your message', {
    audience: 'public',
    preheader: 'Thanks for contacting UPOSA. We will get back to you soon.',
    heading: `Thanks, ${first}. We've got your message`,
    paragraphs: [
      `This confirms the UPOSA desk received your message. A member of the team will reply to this email address, usually within a few working days.`,
    ],
    details: { title: 'Your message', rows: [['Subject', data.subject], ['Message', data.message]] },
    closing: [`Office hours: Monday to Friday 9am to 5pm, Saturday 10am to 2pm. For urgent matters call 0244036676.`],
  });
}

export interface TranscriptRequestInput {
  fullName: string;
  email: string;
  phone?: string | null;
  yearGroup: string | number;
  notes?: string | null;
}

export function buildTranscriptNotification(data: TranscriptRequestInput): BuiltEmail {
  return build(`[UPOSA] Transcript request from ${data.fullName}`, {
    audience: 'staff',
    preheader: `${data.fullName} (${data.yearGroup}) requested a transcript.`,
    heading: 'New transcript request',
    paragraphs: [`A transcript request came in through the website. Reply to this email to contact the requester.`],
    details: {
      rows: [
        ['Name', data.fullName],
        ['Email', data.email],
        ['Phone', data.phone || 'Not given'],
        ['Year group', String(data.yearGroup)],
        ['Notes', data.notes || 'None'],
      ],
    },
    button: { label: 'Open in admin', url: `${env.ADMIN_URL}/contact-messages` },
  });
}

export function buildTranscriptAcknowledgement(data: TranscriptRequestInput): BuiltEmail {
  const first = escapeHtml(firstNameOf(data.fullName));
  return build('Your transcript request has been received', {
    audience: 'public',
    preheader: 'UPOSA received your transcript request and will be in touch.',
    heading: `We've received your request, ${first}`,
    paragraphs: [
      `Thank you. The UPOSA desk has your transcript request and will contact you with the next steps, including any documents or fees the school requires.`,
    ],
    details: { title: 'Request details', rows: [['Name', data.fullName], ['Year group', String(data.yearGroup)], ['Phone', data.phone || 'Not given']] },
    closing: [`Questions? Reply to this email or call 0244036676.`],
  });
}

// ── Payments ──

export interface ReceiptInput {
  name: string;
  kind: 'DUES' | 'DONATION';
  amount: number;
  currency?: string;
  reference?: string | null;
  /** e.g. "Membership dues 2026" or the project title. */
  description: string;
  paidAt?: Date | string | null;
  /** Members get a link to their portal page; guest donors to the projects page. */
  isMember: boolean;
  channel?: string | null;
}

export function buildPaymentReceipt(data: ReceiptInput): BuiltEmail {
  const first = escapeHtml(firstNameOf(data.name));
  const isDonation = data.kind === 'DONATION';
  const rows: Array<[string, string]> = [
    [isDonation ? 'Donation' : 'Payment for', data.description],
    ['Amount', formatMoney(data.amount, data.currency)],
    ['Date', formatDate(data.paidAt || new Date())],
  ];
  if (data.channel) rows.push(['Paid via', data.channel.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())]);
  if (data.reference) rows.push(['Reference', data.reference]);

  const button = data.isMember
    ? { label: isDonation ? 'View my donations' : 'View my dues', url: `${env.CLIENT_URL}/${isDonation ? 'donations' : 'dues'}` }
    : { label: 'See school projects', url: `${SITE_URL}/projects` };

  return build(isDonation ? 'Thank you for your donation to UPOSA' : 'Your UPOSA dues payment is confirmed', {
    audience: data.isMember ? 'member' : 'public',
    footerReason: "You're receiving this receipt because you made a payment to UPOSA.",
    preheader: `${formatMoney(data.amount, data.currency)} received. Thank you!`,
    heading: isDonation ? `Thank you, ${first}!` : `Payment received, ${first}`,
    paragraphs: [
      isDonation
        ? `Your donation has been received. Every cedi goes towards supporting University Practice SHS and its students. Here is your receipt:`
        : `Your membership dues payment has been confirmed. Thank you for keeping the association going. Here is your receipt:`,
    ],
    details: { title: 'Receipt', rows },
    button,
    footnote: `Keep this email for your records. If anything looks wrong, reply to this email or ${emailLink(`${SITE_URL}/contact`, 'contact us')}.`,
  });
}

/** Sample data for every template; used by `npm run email:preview` and the tests. */
export function sampleEmails(): Record<string, BuiltEmail> {
  const contact = { name: 'Ama Mensah', email: 'ama@example.com', subject: 'Year group reunion', message: 'Hello,\nWe are planning a 2008 year group reunion in December. Could UPOSA help us reach classmates?' };
  const transcript = { fullName: 'Kwame Owusu', email: 'kwame@example.com', phone: '0244000000', yearGroup: 2012, notes: 'Needed for a master’s application.' };
  return {
    verification: buildVerificationEmail('sample-token', 'Ama Mensah'),
    'password-reset': buildPasswordResetEmail('sample-token', 'Ama Mensah'),
    'admin-password-reset': buildAdminPasswordResetEmail(`${env.ADMIN_URL}/reset-password?token=sample`, 'Kofi Admin'),
    approval: buildApprovalEmail('Ama Mensah'),
    'contact-notification': buildContactNotification(contact),
    'contact-acknowledgement': buildContactAcknowledgement(contact),
    'transcript-notification': buildTranscriptNotification(transcript),
    'transcript-acknowledgement': buildTranscriptAcknowledgement(transcript),
    'receipt-dues': buildPaymentReceipt({ name: 'Ama Mensah', kind: 'DUES', amount: 200, reference: 'UPOSA-8F2K1Q', description: 'Membership dues 2026', isMember: true, channel: 'MOBILE_MONEY' }),
    'receipt-donation': buildPaymentReceipt({ name: 'Yaw Boateng', kind: 'DONATION', amount: 1500, reference: 'UPOSA-3JD9ZX', description: 'ICT Centre Project', isMember: false, channel: 'CARD' }),
    newsletter: buildMarketingEmail('ama@example.com', {
      subject: 'Homecoming 2026: save the date',
      preheader: 'Join old students back on campus this December.',
      heading: 'Homecoming 2026 is coming',
      paragraphs: [
        'Old students from every year group are heading back to campus on <strong>Saturday, 12 December 2026</strong> for a day of reunions, tours and celebration.',
        `Read the full programme on our ${emailLink(`${SITE_URL}/events`, 'events page')}.`,
      ],
      button: { label: 'RSVP for Homecoming', url: `${SITE_URL}/events` },
    }),
  };
}
