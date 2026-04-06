import { env } from './config/env';
import app from './app';
import prisma from './config/db';

const PORT = env.PORT;

async function startServer(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`
====================================================
  UPOSA API Server
====================================================
  Environment: ${env.NODE_ENV}
  Port:        ${PORT}
  URL:         http://localhost:${PORT}
  Health:      http://localhost:${PORT}/health
====================================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
