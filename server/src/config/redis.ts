import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

try {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    redis.on('error', () => {
      // Silently handle - Redis is optional
    });
  }
} catch (err) {
  // Redis is optional
}

export { redis };
export default redis;
