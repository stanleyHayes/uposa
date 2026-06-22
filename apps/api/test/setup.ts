// Ensure the env schema validates during tests without needing a real .env.
// Runs before any source module (and thus before src/config/env.ts) is imported.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'mongodb://127.0.0.1:27017/uposa_test';
process.env.JWT_SECRET ??= 'test-jwt-secret-value-0123456789';
process.env.JWT_ADMIN_SECRET ??= 'test-admin-secret-value-0123456789';
process.env.CREDENTIALS_ENCRYPTION_KEY ??= 'test-credentials-encryption-key-32x';
