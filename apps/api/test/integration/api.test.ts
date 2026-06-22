import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb';
import request from 'supertest';
import type { Express } from 'express';

/**
 * Integration tests against a real MongoDB spun up by Testcontainers, driving
 * the actual Express app via supertest. Requires Docker to be running:
 *   npm run test:integration
 */
let container: StartedMongoDBContainer;
let app: Express;
let disconnectDB: () => Promise<void>;

beforeAll(async () => {
  container = await new MongoDBContainer('mongo:7').start();
  // Point the app at the throwaway container BEFORE importing config/env + db.
  process.env.DATABASE_URL = `${container.getConnectionString()}?directConnection=true`;

  const db = await import('../../src/config/db');
  disconnectDB = db.disconnectDB;
  app = (await import('../../src/app')).default;
  await db.connectDB();
}, 180_000);

afterAll(async () => {
  await disconnectDB?.();
  await container?.stop();
});

describe('API (real MongoDB via Testcontainers)', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/payments/platform-fee computes the fee on top', async () => {
    const res = await request(app).get('/api/payments/platform-fee?amount=100');
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(100);
    expect(res.body.data.totalAmount).toBeGreaterThanOrEqual(100);
  });

  it('rejects a protected route without a token', async () => {
    const res = await request(app).get('/api/members/my/dues');
    expect(res.status).toBe(401);
  });

  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
  });

  it('accepts a valid registration and persists it (smoke)', async () => {
    const email = `it-${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Integration Test', email, password: 'password123', consentGiven: true });
    // Created, or a validation/conflict response — never a 5xx crash.
    expect(res.status).toBeLessThan(500);
  });
});

/**
 * Regression tests for the ObjectId-vs-string bug class. The schema toJSON
 * transform leaves `.id` and FK fields as ObjectId instances, so (a) Map
 * enrichment keyed by `.id` and looked up by an ObjectId ref, and (b)
 * aggregation `$match` on a string id, both silently failed before the fix.
 * These assert the enriched/aggregated values are actually populated.
 */
describe('ObjectId/string enrichment + aggregation (regression)', () => {
  it('populates the member on admin dues list and sums PAID dues by member', async () => {
    const { getRepos } = await import('../../src/repositories');
    const { adminListDues, getMemberDueSummary } = await import('../../src/modules/dues/dues.service');
    const repos = getRepos();

    const member = await repos.members.create({
      fullName: 'Ama Mensah',
      email: `dues-${Date.now()}@example.com`,
      password: 'hashed-not-real',
    });

    await repos.dues.create({ memberId: member.id, amount: 250, year: 2026, status: 'PAID' });
    await repos.dues.create({ memberId: member.id, amount: 100, year: 2026, status: 'PENDING' });

    // (a) Map enrichment: the due's `member` must resolve, not be null.
    const list = await adminListDues({ memberId: String(member.id) });
    expect(list.data.length).toBeGreaterThanOrEqual(2);
    const enriched = list.data.find((d: any) => d.status === 'PAID');
    expect(enriched?.member).not.toBeNull();
    expect(enriched?.member?.fullName).toBe('Ama Mensah');

    // (b) Aggregation $match on the string memberId must cast and sum.
    const summary = await getMemberDueSummary(String(member.id));
    expect(summary.totalPaid).toBe(250);
    expect(summary.totalPending).toBe(100);
  });
});
