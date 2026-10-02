/**
 * One branded, email-client-safe layout for every UPOSA email.
 *
 * Email clients are not browsers: layout uses tables and inline styles, the
 * button has a VML fallback so it is a full clickable button in Outlook, and
 * the colour scheme is pinned to light so Apple Mail/Outlook dark modes don't
 * invert the brand colours. Every email also gets a plain-text version.
 */

export const BRAND = {
  navy: '#0a1633',
  gold: '#e3b341',
  cream: '#faf7ef',
  page: '#eef0f4',
  text: '#26303f',
  muted: '#5b6678',
  subtle: '#8893a4',
  border: '#e6e9ef',
} as const;

export const SITE_URL = 'https://www.uposa.org';
const LOGO_URL = `${SITE_URL}/email-logo.png`;

const SERIF = "'Fraunces', Georgia, 'Times New Roman', serif";
const SANS = "'Outfit', 'Helvetica Neue', Arial, Helvetica, sans-serif";

/** Escape user-supplied text before interpolating it into email HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** A brand-styled inline link. `label` is trusted HTML; pass escaped text. */
export function emailLink(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" style="color:${BRAND.navy};font-weight:bold;text-decoration:underline;">${label}</a>`;
}

export type EmailAudience = 'member' | 'staff' | 'public' | 'marketing';

export interface EmailContent {
  /** Inbox preview text (hidden in the body). */
  preheader: string;
  heading: string;
  /** Paragraphs of trusted HTML: escape every interpolated value. */
  paragraphs: string[];
  button?: { label: string; url: string };
  /** Label/value rows (receipts, request details). Values are escaped here. */
  details?: { title?: string; rows: Array<[string, string]> };
  /** Paragraphs rendered after the button/details. */
  closing?: string[];
  /** Small print under the body (expiry notes, "ignore this if…"). */
  footnote?: string;
  audience: EmailAudience;
  /** Overrides the audience's default "why you got this" footer line. */
  footerReason?: string;
  /** Required for marketing email. */
  unsubscribeUrl?: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

const P_STYLE = `margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.65;color:${BRAND.text};`;

function paragraph(html: string): string {
  return `<p style="${P_STYLE}">${html}</p>`;
}

function button(label: string, url: string): string {
  const href = escapeHtml(url);
  const text = escapeHtml(label);
  const vmlWidth = Math.max(220, Math.round(label.length * 10.5) + 72);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
  <tr><td>
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:52px;v-text-anchor:middle;width:${vmlWidth}px;" arcsize="12%" stroke="f" fillcolor="${BRAND.navy}">
      <w:anchorlock/>
      <center style="color:${BRAND.cream};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${text} &rarr;</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr><td bgcolor="${BRAND.navy}" style="background-color:${BRAND.navy};border-radius:8px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:15px 32px;font-family:${SANS};font-size:16px;font-weight:bold;line-height:20px;color:${BRAND.cream};text-decoration:none;border-radius:8px;">${text}&nbsp;&rarr;</a>
      </td></tr>
    </table>
    <!--<![endif]-->
  </td></tr>
</table>
<p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${BRAND.muted};">Button not working? Copy this link into your browser:</p>
<p style="margin:4px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;word-break:break-all;">${emailLink(url, escapeHtml(url))}</p>`;
}

function detailsTable(details: NonNullable<EmailContent['details']>): string {
  const rows = details.rows
    .map(([label, value], index) => `
      <tr>
        <td style="padding:10px 16px;font-family:${SANS};font-size:14px;color:${BRAND.muted};width:38%;vertical-align:top;${index ? `border-top:1px solid ${BRAND.border};` : ''}">${escapeHtml(label)}</td>
        <td style="padding:10px 16px;font-family:${SANS};font-size:14px;font-weight:bold;color:${BRAND.navy};vertical-align:top;word-break:break-word;${index ? `border-top:1px solid ${BRAND.border};` : ''}">${escapeHtml(value).replace(/\n/g, '<br/>')}</td>
      </tr>`)
    .join('');
  const title = details.title
    ? `<p style="margin:0 0 8px;font-family:${SANS};font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(details.title)}</p>`
    : '';
  return `
<div style="margin:8px 0 20px;">
  ${title}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.cream}" style="background-color:${BRAND.cream};border:1px solid #efe6cc;border-collapse:collapse;">
    ${rows}
  </table>
</div>`;
}

const FOOTER_REASON: Record<EmailAudience, string> = {
  member: "You're receiving this because of activity on your UPOSA account.",
  staff: 'Sent to the UPOSA association desk.',
  public: "You're receiving this because you contacted UPOSA.",
  marketing: "You're receiving this because you opted in to UPOSA news and updates.",
};

function footer(content: EmailContent): string {
  const link = (url: string, label: string) =>
    `<a href="${url}" target="_blank" style="color:${BRAND.navy};text-decoration:underline;">${label}</a>`;
  const unsubscribe = content.audience === 'marketing' && content.unsubscribeUrl
    ? `<p style="margin:12px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${BRAND.muted};">Don't want these emails? ${link(escapeHtml(content.unsubscribeUrl), 'Unsubscribe')} or change your preferences in your account settings.</p>`
    : '';
  return `
<tr><td bgcolor="#f6f7f9" style="background-color:#f6f7f9;padding:26px 40px;border-top:1px solid ${BRAND.border};">
  <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:${BRAND.text};"><strong>UPOSA</strong> &middot; University Practice Old Students' Association</p>
  <p style="margin:2px 0 12px;font-family:${SANS};font-size:12px;line-height:1.6;color:${BRAND.muted};">University Practice Senior High School, UCC, Cape Coast, Ghana</p>
  <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.8;color:${BRAND.muted};">
    ${link(SITE_URL, 'uposa.org')} &nbsp;&middot;&nbsp; ${link(`${SITE_URL}/contact`, 'Contact us')} &nbsp;&middot;&nbsp; ${link(`${SITE_URL}/privacy`, 'Privacy Policy')}
  </p>
  <p style="margin:12px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${BRAND.subtle};">${escapeHtml(content.footerReason ?? FOOTER_REASON[content.audience])}</p>
  ${unsubscribe}
</td></tr>`;
}

/** Plain-text alternative: improves deliverability and is what some readers show. */
function toText(content: EmailContent): string {
  const strip = (html: string) =>
    html
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_m, href: string, label: string) => {
        const text = label.replace(/<[^>]+>/g, '');
        return text === href ? href : `${text} (${href})`;
      })
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&rarr;/g, '→')
      .replace(/&mdash;/g, '—')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

  const parts: string[] = ['UPOSA — University Practice Old Students\' Association', '', strip(content.heading), ''];
  content.paragraphs.forEach((p) => parts.push(strip(p), ''));
  if (content.details) {
    if (content.details.title) parts.push(content.details.title.toUpperCase());
    content.details.rows.forEach(([label, value]) => parts.push(`${label}: ${value}`));
    parts.push('');
  }
  if (content.button) parts.push(`${content.button.label}: ${content.button.url}`, '');
  (content.closing ?? []).forEach((p) => parts.push(strip(p), ''));
  if (content.footnote) parts.push(strip(content.footnote), '');
  parts.push('—', 'UPOSA · University Practice Senior High School, UCC, Cape Coast, Ghana', `${SITE_URL} · Privacy: ${SITE_URL}/privacy`, content.footerReason ?? FOOTER_REASON[content.audience]);
  if (content.audience === 'marketing' && content.unsubscribeUrl) parts.push(`Unsubscribe: ${content.unsubscribeUrl}`);
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function renderEmail(content: EmailContent): RenderedEmail {
  const body = [
    ...content.paragraphs.map(paragraph),
    content.details ? detailsTable(content.details) : '',
    content.button ? button(content.button.label, content.button.url) : '',
    ...(content.closing ?? []).map((p) => paragraph(p).replace('margin:0 0 16px', 'margin:24px 0 0')),
    content.footnote
      ? `<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid ${BRAND.border};font-family:${SANS};font-size:13px;line-height:1.6;color:${BRAND.muted};">${content.footnote}</p>`
      : '',
  ].join('\n');

  // Pads the inbox preview so body text doesn't trail after the preheader.
  const previewPad = '&#847;&zwnj;&nbsp;'.repeat(60);

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${escapeHtml(content.heading.replace(/<[^>]+>/g, ''))}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><style>td,p,a,h1{font-family:Arial,sans-serif !important;}</style><![endif]-->
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" /><!--<![endif]-->
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
  @media only screen and (max-width:620px) {
    .email-shell { width:100% !important; }
    .email-pad { padding-left:24px !important; padding-right:24px !important; }
    .email-heading { font-size:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(content.preheader)}${previewPad}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.page}" style="background-color:${BRAND.page};">
  <tr><td align="center" style="padding:32px 12px;">
    <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
    <table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:10px;overflow:hidden;">
      <tr><td bgcolor="${BRAND.navy}" class="email-pad" style="background-color:${BRAND.navy};padding:30px 40px 26px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:16px;vertical-align:middle;">
            <a href="${SITE_URL}" target="_blank"><img src="${LOGO_URL}" width="56" height="57" alt="UPOSA crest" style="display:block;border:0;outline:none;width:56px;height:57px;font-family:${SANS};font-size:12px;color:${BRAND.cream};" /></a>
          </td>
          <td style="vertical-align:middle;">
            <div style="font-family:${SERIF};font-size:30px;font-weight:bold;line-height:1;letter-spacing:2px;color:${BRAND.cream};">UPOSA</div>
            <div style="margin-top:6px;font-family:${SANS};font-size:11px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;color:${BRAND.gold};">The Legit Elites</div>
          </td>
        </tr></table>
      </td></tr>
      <tr><td bgcolor="${BRAND.gold}" style="background-color:${BRAND.gold};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="email-pad" style="padding:38px 40px 36px;">
        <h1 class="email-heading" style="margin:0 0 18px;font-family:${SERIF};font-size:27px;line-height:1.25;font-weight:bold;color:${BRAND.navy};">${content.heading}</h1>
        ${body}
      </td></tr>
      ${footer(content)}
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>
</body>
</html>`;

  return { html, text: toText(content) };
}
