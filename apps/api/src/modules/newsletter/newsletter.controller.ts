import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { subscribeSchema, unsubscribeSchema } from './newsletter.validation';
import { subscribe, listSubscribers, unsubscribe, deleteSubscriber, optOutOfMarketing } from './newsletter.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { isValidUnsubscribeToken } from '../../utils/email.utils';
import { BRAND } from '../../utils/email-layout';

export async function subscribeHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = subscribeSchema.parse({ body: req.body });
  const result = await subscribe(parsed.body);
  successResponse(res, result.alreadySubscribed ? 'Already subscribed' : 'Subscribed successfully', result, 201);
}

// Admin
export async function adminListSubscribersHandler(req: RouteRequest, res: Response): Promise<void> {
  const { data, meta } = await listSubscribers(req.query as Record<string, string>);
  successResponse(res, 'Subscribers retrieved', data, 200, meta);
}

export async function adminUnsubscribeHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await unsubscribe(req.params.id);
  successResponse(res, result.message);
}

export async function adminDeleteSubscriberHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await deleteSubscriber(req.params.id);
  successResponse(res, result.message);
}

// Public: unsubscribe link from a marketing/newsletter email. The signed token
// (HMAC of the email) means no login is needed and links can't be forged.
// GET renders a confirmation page; POST is RFC 8058 one-click (mail clients).
async function handleUnsubscribe(req: RouteRequest): Promise<boolean> {
  // One-click POSTs may carry the params in the query string or the form body.
  const parsed = unsubscribeSchema.safeParse({ query: { ...req.query, ...(typeof req.body === 'object' ? req.body : {}) } });
  if (!parsed.success || !isValidUnsubscribeToken(parsed.data.query.email, parsed.data.query.token)) return false;
  await optOutOfMarketing(parsed.data.query.email);
  return true;
}

export async function unsubscribePageHandler(req: RouteRequest, res: Response): Promise<void> {
  const ok = await handleUnsubscribe(req);
  const message = ok
    ? "You've been unsubscribed from UPOSA newsletters and updates. Account emails (password resets, receipts) are not affected."
    : 'This unsubscribe link is invalid or incomplete.';
  res.status(ok ? 200 : 400).type('html').send(renderUnsubscribePage(ok, message));
}

/** Branded confirmation page (typographic wordmark: the API's CSP blocks external images). */
function renderUnsubscribePage(ok: boolean, message: string): string {
  const { navy, gold, cream, muted } = BRAND;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${ok ? 'Unsubscribed' : 'Link not valid'} | UPOSA</title><meta name="robots" content="noindex"></head>` +
    `<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#eef0f4;font-family:'Helvetica Neue',Arial,sans-serif;color:${navy};">` +
    `<main style="width:100%;max-width:460px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 12px 40px rgba(10,22,51,.12);">` +
    `<div style="background:${navy};padding:24px 28px;"><div style="font-family:Georgia,serif;font-size:28px;font-weight:bold;letter-spacing:2px;color:${cream};">UPOSA</div>` +
    `<div style="margin-top:6px;font-size:11px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;color:${gold};">The Legit Elites</div></div>` +
    `<div style="height:4px;background:${gold};"></div>` +
    `<div style="padding:28px;"><h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;">${ok ? "You're unsubscribed" : 'This link is not valid'}</h1>` +
    `<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#26303f;">${message}</p>` +
    `<a href="https://www.uposa.org" style="display:inline-block;background:${navy};color:${cream};font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:8px;">Go to uposa.org &rarr;</a>` +
    `<p style="margin:20px 0 0;font-size:13px;color:${muted};">Changed your mind? Turn news emails back on in your account settings.</p></div></main></body></html>`;
}

export async function unsubscribeOneClickHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!(await handleUnsubscribe(req))) {
    errorResponse(res, 'Invalid unsubscribe link', 400);
    return;
  }
  successResponse(res, 'Unsubscribed');
}
