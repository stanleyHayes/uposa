/**
 * READ-ONLY report of case-insensitive duplicate emails ("Ama@x.com" vs
 * "ama@x.com") in members and admins. These block the case-insensitive unique
 * email index (see src/config/db.ts). Emails are masked; nothing is modified.
 *
 * Run with: npm run check:email-duplicates -w apps/api   (uses DATABASE_URL)
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { caseInsensitiveDuplicateEmailPipeline, maskEmail } from '../src/utils/search.utils';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

interface DuplicateGroup {
  count: number;
  accounts: Array<{ id: unknown; email: string; createdAt?: Date }>;
}

async function main() {
  const client = new MongoClient(DATABASE_URL as string);
  await client.connect();
  try {
    const db = client.db();
    let total = 0;

    for (const collection of ['members', 'admins']) {
      const groups = (await db.collection(collection).aggregate(caseInsensitiveDuplicateEmailPipeline()).toArray()) as unknown as DuplicateGroup[];
      total += groups.length;
      console.log(`\n${collection}: ${groups.length} case-insensitive duplicate group(s)`);
      for (const group of groups) {
        console.log(`  • ${maskEmail(group.accounts[0].email.toLowerCase())} — ${group.count} accounts`);
        for (const account of group.accounts) {
          const created = account.createdAt ? new Date(account.createdAt).toISOString().slice(0, 10) : 'unknown';
          console.log(`      id=${String(account.id)}  stored=${maskEmail(account.email)}  created=${created}`);
        }
      }
    }

    console.log(total === 0
      ? '\nNo duplicates: the case-insensitive unique email index can be built.'
      : `\n${total} group(s) must be merged or renamed by an operator before the index can be built. This script changed nothing.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('Check failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
