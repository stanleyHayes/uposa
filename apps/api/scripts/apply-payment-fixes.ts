/**
 * Idempotent, targeted update for the live database — does NOT wipe any data.
 * - Sets the platform fee to 1% (enabled, no fixed component).
 * - Enables the PAYSTACK payment method.
 *
 * Run with: npx ts-node scripts/apply-payment-fixes.ts
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

const client = new MongoClient(DATABASE_URL);

async function main() {
  await client.connect();
  const db = client.db();
  const now = new Date();

  const fee: Array<[string, string | number]> = [
    ['PAYMENT_PLATFORM_FEE_ENABLED', 'true'],
    ['PAYMENT_PLATFORM_FEE_PERCENT', 1],
    ['PAYMENT_PLATFORM_FEE_FIXED', 0],
  ];
  for (const [key, value] of fee) {
    await db.collection('site_config').updateOne(
      { key },
      { $set: { key, value, updatedAt: now } },
      { upsert: true },
    );
  }
  console.log('Platform fee set to 1% (enabled).');

  const res = await db.collection('payment_methods').updateOne(
    { provider: 'PAYSTACK' },
    { $set: { isEnabled: true, updatedAt: now } },
  );
  console.log(`PAYSTACK enabled — matched ${res.matchedCount}, modified ${res.modifiedCount}.`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
