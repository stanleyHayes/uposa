import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Structured application logger. JSON in production (machine-parseable for log
 * drains); pretty-printed in development. Sensitive fields are redacted.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : isTest ? 'silent' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.secret',
      '*.authorization',
    ],
    censor: '[redacted]',
  },
  ...(isProd || isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
});
