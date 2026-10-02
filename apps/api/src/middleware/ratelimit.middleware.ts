import rateLimit, { Options } from 'express-rate-limit';

// Standard error shape returned by the API, sent when a client exceeds a limit.
const tooManyRequestsBody = {
  success: false,
  message: 'Too many requests, try again later',
};

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequestsBody,
};

/**
 * Strict limiter for authentication endpoints (login, register, refresh,
 * forgot-password, reset-password). Counts both successful and failed
 * requests so brute-force attempts and credential stuffing are throttled.
 *
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: false,
});

/**
 * Limiter for `/auth/refresh`. Clients refresh every access-token lifetime
 * (15 min), so sharing authLimiter's 10-request budget meant a handful of users
 * behind one NAT/carrier IP got 429s on refresh — and then on login too.
 * Refresh needs a valid signed token, so it isn't a brute-force target.
 *
 * 60 requests per 15 minutes per IP.
 */
export const refreshLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 60,
});

/**
 * Limiter for inbound payment webhooks (Paystack, Stripe, crypto).
 * Providers may burst when retrying, so the budget is generous.
 *
 * 60 requests per minute per IP.
 */
export const webhookLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 60,
});

/**
 * Limiter for payment customer-facing endpoints (initialize, verify, status).
 * Prevents abuse of payment provider resources without disrupting normal flows.
 *
 * 30 requests per minute per IP.
 */
export const paymentLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 30,
});

/**
 * Limiter for the admin surface (`/api/admin/*`). Admin endpoints are already
 * behind adminMiddleware; this is defense-in-depth against a compromised token
 * being used to hammer mutations or scrape data.
 *
 * 120 requests per minute per IP (generous for normal dashboard use).
 */
export const adminLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 120,
});

/**
 * Limiter for file-upload endpoints — uploads are expensive (memory + Cloudinary)
 * and a natural abuse target. It sits on admin create/update routes that also
 * accept plain JSON edits, so only multipart requests (actual uploads) count.
 *
 * 100 uploads per 15 minutes per IP.
 */
export const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => !req.is('multipart/form-data'),
});

/**
 * Limiters for unauthenticated public write endpoints (contact form, transcript
 * requests, newsletter signup, guest donations, event RSVPs) — prime targets for
 * spam and storage bloat. Each endpoint gets its OWN counter: one shared
 * instance meant a few people behind a carrier-NAT IP exhausted every form.
 *
 * 20 submissions per 15 minutes per IP, per endpoint.
 */
function publicWriteLimiter() {
  return rateLimit({
    ...baseOptions,
    windowMs: 15 * 60 * 1000,
    max: 20,
  });
}

export const contactLimiter = publicWriteLimiter();
export const transcriptLimiter = publicWriteLimiter();
export const newsletterLimiter = publicWriteLimiter();
export const donationLimiter = publicWriteLimiter();
export const rsvpLimiter = publicWriteLimiter();
