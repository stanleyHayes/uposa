import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

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
