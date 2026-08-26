import app from './app';
import { env } from './config/environment';
import { logger } from './utils/logger';
import { connectDB } from './config/database';

const startServer = async () => {
  try {
    await connectDB();

    try {
      const { redis } = await import('./config/redis');
      await redis?.ping();
      logger.info('✅ Redis connected');
    } catch (err) {
      logger.warn('⚠️ Redis not available - running without cache');
    }

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
