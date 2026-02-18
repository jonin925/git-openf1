
import { Server as SocketServer } from 'socket.io';
import { openF1Service } from './openf1Service';
import { logger } from '../utils/logger';

interface LiveSession {
  sessionKey: number;
  meetingKey: number;
  sessionName: string;
  isActive: boolean;
  lastUpdate: Date;
  updateInterval?: NodeJS.Timeout;
}

class LiveSessionService {
  private io: SocketServer | null = null;
  private activeSessions: Map<number, LiveSession> = new Map();
  private readonly UPDATE_INTERVAL_MS = 4000; // OpenF1 updates ~every 4 seconds

  initialize(io: SocketServer) {
    this.io = io;
    logger.info('Live session service initialized');
  }

  async startLiveTracking(sessionKey: number, meetingKey: number, sessionName: string) {
    if (this.activeSessions.has(sessionKey)) {
      logger.warn(`Session ${sessionKey} is already being tracked`);
      return;
    }

    const session: LiveSession = {
      sessionKey,
      meetingKey,
      sessionName,
      isActive: true,
      lastUpdate: new Date(),
    };

    // Start the update loop
    session.updateInterval = setInterval(
      () => this.fetchAndBroadcastData(sessionKey),
      this.UPDATE_INTERVAL_MS
    );

    this.activeSessions.set(sessionKey, session);
    
    // Notify clients
    this.io?.emit('live:session:started', {
      sessionKey,
      sessionName,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Started live tracking for session ${sessionKey}`);
  }

  stopLiveTracking(sessionKey: number) {
    const session = this.activeSessions.get(sessionKey);
    if (!session) {
      logger.warn(`Session ${sessionKey} is not being tracked`);
      return;
    }

    if (session.updateInterval) {
      clearInterval(session.updateInterval);
    }

    session.isActive = false;
    this.activeSessions.delete(sessionKey);

    this.io?.emit('live:session:ended', {
      sessionKey,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Stopped live tracking for session ${sessionKey}`);
  }

  private async fetchAndBroadcastData(sessionKey: number) {
    try {
      const session = this.activeSessions.get(sessionKey);
      if (!session || !session.isActive) return;

      // Fetch all live data in parallel
      const [positions, intervals, carData, weather] = await Promise.allSettled([
        openF1Service.getPositions(sessionKey),
        openF1Service.getIntervals(sessionKey),
        this.fetchLatestCarData(sessionKey),
        openF1Service.getWeather(sessionKey),
      ]);

      const liveData = {
        sessionKey,
        timestamp: new Date().toISOString(),
        positions: positions.status === 'fulfilled' ? positions.value : null,
        intervals: intervals.status === 'fulfilled' ? intervals.value : null,
        carData: carData.status === 'fulfilled' ? carData.value : null,
        weather: weather.status === 'fulfilled' ? weather.value : null,
      };

      // Broadcast to all clients watching this session
      this.io?.to(`session:${sessionKey}`).emit('live:data', liveData);
      
      session.lastUpdate = new Date();
    } catch (error) {
      logger.error(`Error fetching live data for session ${sessionKey}:`, error);
    }
  }

  private async fetchLatestCarData(sessionKey: number) {
    // Fetch car data for top positions only to reduce API load
    const positions = await openF1Service.getPositions(sessionKey);
    const topDrivers = positions.slice(0, 5).map((p: any) => p.driver_number);
    
    const carDataPromises = topDrivers.map((driverNum: number) =>
      openF1Service.getCarData(sessionKey, driverNum)
    );
    
    const results = await Promise.allSettled(carDataPromises);
    return results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r, i) => ({ driverNumber: topDrivers[i], data: r.value }));
  }

  getActiveSessions(): LiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  isSessionActive(sessionKey: number): boolean {
    return this.activeSessions.has(sessionKey);
  }
}

export const liveSessionService = new LiveSessionService();