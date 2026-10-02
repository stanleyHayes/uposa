import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';
import { Member, Admin, EMAIL_CI_INDEX } from '../models';
import { caseInsensitiveDuplicateEmailPipeline } from '../utils/search.utils';

/**
 * Make sure the case-insensitive unique email indexes exist. Mongoose's
 * autoIndex (on by default — nothing in this app disables it) builds them at
 * startup, but it swallows failures silently. If case-variant duplicates
 * already exist the build fails: log how many (never the emails) and keep
 * serving — the app-level case-insensitive checks still prevent new ones.
 */
export async function ensureEmailIndexes(): Promise<void> {
  for (const model of [Member, Admin]) {
    try {
      // Idempotent: a no-op when autoIndex already built it with the same options.
      await model.collection.createIndex(EMAIL_CI_INDEX.fields, EMAIL_CI_INDEX.options);
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code === 11000) {
        const groups = await model.collection.aggregate(caseInsensitiveDuplicateEmailPipeline()).toArray().catch(() => []);
        logger.error(
          { collection: model.collection.collectionName, duplicateGroups: groups.length },
          `Case-insensitive unique email index NOT created: ${groups.length} group(s) of case-variant duplicate emails exist. ` +
          'Run `npm run check:email-duplicates -w apps/api` to review them.',
        );
      } else {
        logger.error({ err, collection: model.collection.collectionName }, 'Could not create case-insensitive email index');
      }
    }
  }
}

const MAX_RETRIES = 5;

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(env.DATABASE_URL, {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      logger.info('MongoDB connected via Mongoose');
      // Background: never blocks startup and never throws.
      void ensureEmailIndexes();

      mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
      mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
      return;
    } catch (error) {
      logger.error({ err: error, attempt }, `MongoDB connection failed (${attempt}/${MAX_RETRIES})`);
      if (attempt === MAX_RETRIES) {
        logger.fatal('Could not connect to MongoDB after retries — exiting');
        process.exit(1);
      }
      // Exponential backoff, capped at 10s.
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 10000)));
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
