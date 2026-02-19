import openf1Client from '../config/openf1';
import { 
  OpenF1Meeting, OpenF1Session, OpenF1Driver, 
  OpenF1Result, OpenF1Lap, OpenF1CarData, OpenF1Position 
} from '../types';
import { logger } from '../utils/logger';
import { sleep, filterUnique } from '../utils/helpers';

class OpenF1Service {
  private requestDelay: number = 500; // ms between requests

  private async throttle(): Promise<void> {
    await sleep(this.requestDelay);
  }

  // Fetch all meetings for a year
  async fetchMeetings(year: number): Promise<OpenF1Meeting[]> {
    try {
      const meetings = await openf1Client.getMeetings({ year });
      logger.info(`Fetched ${meetings.length} meetings for year ${year}`);
      return meetings;
    } catch (error) {
      logger.error(`Failed to fetch meetings for year ${year}:`, error);
      throw error;
    }
  }

  // Fetch sessions for a meeting
  async fetchSessions(meetingKey: number): Promise<OpenF1Session[]> {
    try {
      await this.throttle();
      const sessions = await openf1Client.getSessions({ meeting_key: meetingKey });
      logger.info(`Fetched ${sessions.length} sessions for meeting ${meetingKey}`);
      return sessions;
    } catch (error) {
      logger.error(`Failed to fetch sessions for meeting ${meetingKey}:`, error);
      throw error;
    }
  }

  // Fetch drivers for a session
  async fetchDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
    try {
      await this.throttle();
      const drivers = await openf1Client.getDrivers({ session_key: sessionKey });
      return filterUnique(drivers, d => `${d.driver_number}-${d.session_key}`);
    } catch (error) {
      logger.error(`Failed to fetch drivers for session ${sessionKey}:`, error);
      throw error;
    }
  }

  // Fetch results for a session
  async fetchResults(sessionKey: number): Promise<OpenF1Result[]> {
    try {
      await this.throttle();
      const results = await openf1Client.getResults({ session_key: sessionKey });
      return results;
    } catch (error) {
      logger.error(`Failed to fetch results for session ${sessionKey}:`, error);
      return []; // Results might not be available yet
    }
  }

  // Fetch laps for a session
  async fetchLaps(sessionKey: number, driverNumber?: number): Promise<OpenF1Lap[]> {
    try {
      await this.throttle();
      const params: any = { session_key: sessionKey };
      if (driverNumber) params.driver_number = driverNumber;
      const laps = await openf1Client.getLaps(params);
      return laps;
    } catch (error) {
      logger.error(`Failed to fetch laps for session ${sessionKey}:`, error);
      return [];
    }
  }

  // Fetch car data (telemetry)
  async fetchCarData(sessionKey: number, driverNumber?: number): Promise<OpenF1CarData[]> {
    try {
      await this.throttle();
      const params: any = { session_key: sessionKey };
      if (driverNumber) params.driver_number = driverNumber;
      const data = await openf1Client.getCarData(params);
      return data;
    } catch (error) {
      logger.error(`Failed to fetch car data for session ${sessionKey}:`, error);
      return [];
    }
  }

  // Fetch positions
  async fetchPositions(sessionKey: number): Promise<OpenF1Position[]> {
    try {
      await this.throttle();
      const positions = await openf1Client.getPositions({ session_key: sessionKey });
      return positions;
    } catch (error) {
      logger.error(`Failed to fetch positions for session ${sessionKey}:`, error);
      return [];
    }
  }

  // Fetch weather data
  async fetchWeather(sessionKey: number) {
    try {
      await this.throttle();
      return await openf1Client.getWeather({ session_key: sessionKey });
    } catch (error) {
      logger.error(`Failed to fetch weather for session ${sessionKey}:`, error);
      return [];
    }
  }

  // Fetch pit stops
  async fetchPitStops(sessionKey: number) {
    try {
      await this.throttle();
      return await openf1Client.getPitStops({ session_key: sessionKey });
    } catch (error) {
      logger.error(`Failed to fetch pit stops for session ${sessionKey}:`, error);
      return [];
    }
  }

  // Fetch intervals (live timing)
  async fetchIntervals(sessionKey: number) {
    try {
      await this.throttle();
      return await openf1Client.getIntervals({ session_key: sessionKey });
    } catch (error) {
      logger.error(`Failed to fetch intervals for session ${sessionKey}:`, error);
      return [];
    }
  }

  // Fetch championship standings
  async fetchDriverStandings(sessionKey: number) {
    try {
      await this.throttle();
      return await openf1Client.getChampionshipDrivers({ session_key: sessionKey });
    } catch (error) {
      logger.error(`Failed to fetch driver standings:`, error);
      return [];
    }
  }

  async fetchConstructorStandings(sessionKey: number) {
    try {
      await this.throttle();
      return await openf1Client.getChampionshipTeams({ session_key: sessionKey });
    } catch (error) {
      logger.error(`Failed to fetch constructor standings:`, error);
      return [];
    }
  }

  // Get latest meeting key
  async getLatestMeetingKey(): Promise<number | null> {
    try {
      const meetings = await openf1Client.getMeetings({ year: new Date().getFullYear() });
      if (meetings.length === 0) return null;
      
      // Sort by date and return the most recent or upcoming
      const sorted = meetings.sort((a, b) => 
        new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      );
      
      const now = new Date();
      const upcoming = sorted.find(m => new Date(m.date_start) > now);
      return upcoming ? upcoming.meeting_key : sorted[sorted.length - 1]?.meeting_key;
    } catch (error) {
      logger.error('Failed to get latest meeting key:', error);
      return null;
    }
  }

  // Get latest session key
  async getLatestSessionKey(): Promise<number | null> {
    try {
      const sessions = await openf1Client.getSessions({ year: new Date().getFullYear() });
      if (sessions.length === 0) return null;
      
      const now = new Date();
      const liveOrUpcoming = sessions.find(s => 
        new Date(s.date_start) <= now && new Date(s.date_end) >= now
      );
      
      if (liveOrUpcoming) return liveOrUpcoming.session_key;
      
      const upcoming = sessions.find(s => new Date(s.date_start) > now);
      return upcoming ? upcoming.session_key : sessions[sessions.length - 1]?.session_key;
    } catch (error) {
      logger.error('Failed to get latest session key:', error);
      return null;
    }
  }
}

export const openf1Service = new OpenF1Service();
export default openf1Service;