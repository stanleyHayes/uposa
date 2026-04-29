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
