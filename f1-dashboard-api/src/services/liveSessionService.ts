import { openf1Service } from './openf1Service';
import { cacheService } from './cacheService';
import Session from '../models/Session';
import { LiveRaceData, LiveDriverPosition } from '../types';
import { logger } from '../utils/logger';
import { getIO } from '../websocket/liveSocket';

class LiveSessionService {
  private activeSessions: Map<number, NodeJS.Timeout> = new Map();
  private readonly UPDATE_INTERVAL = 4000; // 4 seconds (OpenF1 updates every ~4s)

  async startLiveTracking(sessionKey: number): Promise<void> {
    if (this.activeSessions.has(sessionKey)) {
      logger.info(`Live tracking already active for session ${sessionKey}`);
      return;
    }

    logger.info(`Starting live tracking for session ${sessionKey}`);
    
    // Initial fetch
    await this.updateLiveData(sessionKey);

    // Set up interval
    const interval = setInterval(async () => {
      await this.updateLiveData(sessionKey);
    }, this.UPDATE_INTERVAL);

    this.activeSessions.set(sessionKey, interval);
  }

  stopLiveTracking(sessionKey: number): void {
    const interval = this.activeSessions.get(sessionKey);
    if (interval) {
      clearInterval(interval);
      this.activeSessions.delete(sessionKey);
      logger.info(`Stopped live tracking for session ${sessionKey}`);
    }
  }

  private async updateLiveData(sessionKey: number): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Fetch positions and intervals in parallel
      const [positions, intervals, carData] = await Promise.all([
        openf1Service.fetchPositions(sessionKey),
        openf1Service.fetchIntervals(sessionKey),
        this.fetchLatestCarData(sessionKey)
      ]);

      if (positions.length === 0) {
        logger.warn(`No position data for session ${sessionKey}`);
        return;
      }

      // Get latest position for each driver
      const latestPositions = this.getLatestPositions(positions);
      
      // Build live data structure
      const liveData: LiveRaceData = {
        lastUpdate: new Date().toISOString(),
        refreshRate: this.UPDATE_INTERVAL,
        driverPositions: latestPositions.map(pos => {
          const interval = intervals.find(i => i.driver_number === pos.driver_number);
          const car = carData.find(c => c.driver_number === pos.driver_number);
          
          return {
            driverNumber: pos.driver_number,
            driverName: '', // Will be filled from DB
            team: '',
            teamColor: '',
            position: pos.position,
            gapToLeader: interval?.gap_to_leader || '-',
            interval: interval?.interval || '-',
            x: car?.x,
            y: car?.y,
            z: car?.z
          };
        })
      };

      // Enrich with driver info from DB
      await this.enrichDriverInfo(liveData.driverPositions, sessionKey);

      // Cache and broadcast
      await cacheService.setLiveSession(sessionKey, liveData);
      
      const io = getIO();
      io.to(`session:${sessionKey}`).emit('liveUpdate', liveData);

      const duration = Date.now() - startTime;
      logger.debug(`Live update for session ${sessionKey} completed in ${duration}ms`);
    } catch (error) {
      logger.error(`Failed to update live data for session ${sessionKey}:`, error);
    }
  }

  private async fetchLatestCarData(sessionKey: number): Promise<any[]> {
    try {
      // Get car data from last 5 seconds only
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      const data = await openf1Service.fetchCarData(sessionKey);
      return data.filter(d => new Date(d.date) > new Date(fiveSecondsAgo));
    } catch {
      return [];
    }
  }

  private getLatestPositions(positions: any[]): any[] {
    const driverMap = new Map();
    
    for (const pos of positions) {
      const existing = driverMap.get(pos.driver_number);
      if (!existing || new Date(pos.date) > new Date(existing.date)) {
        driverMap.set(pos.driver_number, pos);
      }
    }
    
    return Array.from(driverMap.values())
      .sort((a, b) => a.position - b.position);
  }

  private async enrichDriverInfo(positions: LiveDriverPosition[], sessionKey: number): Promise<void> {
    const { default: Driver } = await import('../models/Driver');
    
    for (const pos of positions) {
      const driver = await Driver.findOne({
        where: { driverNumber: pos.driverNumber, sessionKey }
      });
      
      if (driver) {
        pos.driverName = driver.getDisplayName();
        pos.team = driver.teamName;
        pos.teamColor = driver.getTeamColorHex();
      }
    }
  }

  async getLiveData(sessionKey: number): Promise<LiveRaceData | null> {
    // Check if we have cached live data
    const cached = await cacheService.getLiveSession(sessionKey);
    if (cached) return cached;

    // Check if session is actually live
    const session = await Session.findByPk(sessionKey);
    if (!session || !session.isLive()) return null;

    // Start tracking if not already
    if (!this.activeSessions.has(sessionKey)) {
      await this.startLiveTracking(sessionKey);
    }

    return null;
  }

  async detectAndStartLiveSessions(): Promise<void> {
    try {
      const liveSessions = await Session.findLiveSessions();
      
      for (const session of liveSessions) {
        if (!this.activeSessions.has(session.sessionKey)) {
          await this.startLiveTracking(session.sessionKey);
        }
      }

      // Stop tracking sessions that are no longer live
      const liveKeys = new Set(liveSessions.map(s => s.sessionKey));
      for (const [key, interval] of this.activeSessions.entries()) {
        if (!liveKeys.has(key)) {
          this.stopLiveTracking(key);
        }
      }
    } catch (error) {
      logger.error('Failed to detect live sessions:', error);
    }
  }

  getActiveSessions(): number[] {
    return Array.from(this.activeSessions.keys());
  }
}

export const liveSessionService = new LiveSessionService();
export default liveSessionService;