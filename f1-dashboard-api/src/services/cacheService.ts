import { cacheGet, cacheSet, cacheDelete, cacheClearPattern } from '../config/redis';
import { logger } from '../utils/logger';

class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly SHORT_TTL = 300;    // 5 minutes
  private readonly LONG_TTL = 86400;   // 24 hours

  // Generate cache key
  key(...parts: (string | number)[]): string {
    return `f1:${parts.join(':')}`;
  }

  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    try {
      return await cacheGet<T>(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached data
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await cacheSet(key, value, ttl);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  // Delete cached data
  async delete(key: string): Promise<void> {
    try {
      await cacheDelete(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  // Clear pattern
  async clearPattern(pattern: string): Promise<void> {
    try {
      await cacheClearPattern(`f1:${pattern}`);
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
    }
  }

  // Cache wrappers for specific entities
  async getYears(): Promise<any[] | null> {
    return this.get(this.key('years', 'all'));
  }

  async setYears(data: any[]): Promise<void> {
    return this.set(this.key('years', 'all'), data, this.LONG_TTL);
  }

  async getYear(year: number): Promise<any | null> {
    return this.get(this.key('year', year));
  }

  async setYear(year: number, data: any): Promise<void> {
    return this.set(this.key('year', year), data, this.LONG_TTL);
  }

  async getMeeting(meetingKey: number): Promise<any | null> {
    return this.get(this.key('meeting', meetingKey));
  }

  async setMeeting(meetingKey: number, data: any): Promise<void> {
    return this.set(this.key('meeting', meetingKey), data, this.DEFAULT_TTL);
  }

  async getSession(sessionKey: number): Promise<any | null> {
    return this.get(this.key('session', sessionKey));
  }

  async setSession(sessionKey: number, data: any, isLive: boolean = false): Promise<void> {
    const ttl = isLive ? this.SHORT_TTL : this.DEFAULT_TTL;
    return this.set(this.key('session', sessionKey), data, ttl);
  }

  async getLiveSession(sessionKey: number): Promise<any | null> {
    return this.get(this.key('live', 'session', sessionKey));
  }

  async setLiveSession(sessionKey: number, data: any): Promise<void> {
    return this.set(this.key('live', 'session', sessionKey), data, 10); // 10 seconds
  }

  async getTelemetry(sessionKey: number, driverNumber?: number): Promise<any | null> {
    const key = driverNumber 
      ? this.key('telemetry', sessionKey, driverNumber)
      : this.key('telemetry', sessionKey);
    return this.get(key);
  }

  async setTelemetry(sessionKey: number, data: any, driverNumber?: number): Promise<void> {
    const key = driverNumber 
      ? this.key('telemetry', sessionKey, driverNumber)
      : this.key('telemetry', sessionKey);
    return this.set(key, data, this.SHORT_TTL);
  }

  // Invalidate cache for a meeting and its sessions
  async invalidateMeeting(meetingKey: number): Promise<void> {
    await this.clearPattern(`*:${meetingKey}:*`);
    await this.delete(this.key('meeting', meetingKey));
  }
}

export const cacheService = new CacheService();
export default cacheService;