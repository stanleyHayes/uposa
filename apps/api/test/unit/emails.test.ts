import { describe, it, expect } from 'vitest';

import { env } from '../../src/config/env';
import {
  buildContactNotification,
  buildMarketingEmail,
  buildPaymentReceipt,
  buildVerificationEmail,
  sampleEmails,
} from '../../src/utils/email.utils';
import { BRAND } from '../../src/utils/email-layout';

describe('branded emails', () => {
  const all = Object.entries(sampleEmails());

  it.each(all)('%s uses the branded layout with a plain-text version', (_name, email) => {
    expect(email.subject.length).toBeGreaterThan(5);
    expect(email.html).toContain('https://www.uposa.org/email-logo.png');
    expect(email.html).toContain(BRAND.navy);
    expect(email.html).toContain(BRAND.gold);
    expect(email.html).toContain('color-scheme" content="light only"');
    expect(email.html).toContain('https://www.uposa.org/privacy');
    // Footer links use the canonical www host (the apex redirects).
    expect(email.html).not.toMatch(/href="https:\/\/uposa\.org/);
    expect(email.text).toContain('UPOSA');
    // No leftover markup ("Name <email>" is fine in plain text).
    expect(email.text).not.toMatch(/<\/?(p|a|br|strong|em|div|span|table|tr|td|img|h1)\b/i);
  });

  it('renders the call-to-action as a bulletproof button with a fallback link', () => {
    const { html, text } = buildVerificationEmail('tok-123', 'Ama Mensah');
    const url = `${env.CLIENT_URL}/verify-email/tok-123`;
    expect(html).toContain('v:roundrect'); // Outlook
    expect(html.split(`href="${url}"`).length - 1).toBeGreaterThanOrEqual(3); // VML + button + fallback
    expect(text).toContain(`Confirm my email: ${url}`);
  });

  it('escapes user-supplied text everywhere it appears', () => {
    const { html } = buildContactNotification({
      name: '<img src=x onerror=alert(1)>',
      email: 'x@example.com',
      subject: '<script>alert(1)</script>',
      message: '<a href="https://evil.example">Claim</a>',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('href="https://evil.example"');
    expect(html).toContain('&lt;script&gt;');
  });

  it('formats receipts in cedis and Ghana time, with a payment-specific footer', () => {
    const { html, text } = buildPaymentReceipt({
      name: 'Yaw Boateng', kind: 'DONATION', amount: 1500, description: 'ICT Centre Project',
      reference: 'UPOSA-1', paidAt: '2026-10-01T23:30:00Z', isMember: false, channel: 'MOBILE_MONEY',
    });
    expect(text).toContain('Amount: GH₵ 1,500.00');
    expect(text).toContain('Date: 1 October 2026'); // 23:30 UTC is still 1 October in Accra
    expect(text).toContain('Paid via: Mobile money');
    expect(html).toContain('because you made a payment to UPOSA');
  });

  it('marketing email always carries an unsubscribe link', () => {
    const { html, text } = buildMarketingEmail('ama@example.com', {
      subject: 'News', preheader: 'News', heading: 'News', paragraphs: ['Hello'],
    });
    expect(html).toContain('/api/newsletter/unsubscribe?email=ama%40example.com');
    expect(text).toContain('Unsubscribe: ');
  });
});
