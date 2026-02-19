bimport Redis from 'ioredis';
import { config } from 'dotenv';
import { logger } from '../utils/logger';

config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'redis', // Docker service name
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  // Docker networking settings
  connectTimeout: 10000,
  commandTimeout: 5000,
  keepAlive: 30000
};

export const redis = new Redis(redisConfig);

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
    logger.info('✅ Redis connection established successfully.');
  } catch (error) {
    logger.warn('⚠️  Redis connection failed. Continuing without cache:', error);
    // Don't throw - Redis is optional
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: any, ttl: number = 3600): Promise<void> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // Silent fail - cache is optional
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch {
    // Silent fail
  }
};

export const cacheClearPattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silent fail
  }
};

export default redis;