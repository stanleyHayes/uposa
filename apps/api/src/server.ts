import http from 'http';
import { env } from './config/env';
import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { initSocket } from './config/socket';

const PORT = env.PORT;

async function startServer(): Promise<void> {
  try {
    await connectDB();
    console.log('Database connected successfully');

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      const isProd = env.NODE_ENV === 'production';
      const where = isProd
        ? `  Listening:   0.0.0.0:${PORT} (served behind your platform/proxy)
  Health:      /health`
        : `  URL:         http://localhost:${PORT}
  Health:      http://localhost:${PORT}/health
  WebSocket:   ws://localhost:${PORT}`;
      console.log(`
====================================================
  UPOSA API Server
====================================================
  Environment: ${env.NODE_ENV}
  Port:        ${PORT}
${where}
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
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDB();
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
