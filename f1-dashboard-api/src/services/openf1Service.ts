
import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

class OpenF1Service {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: OPENF1_BASE_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  // Meetings (Races)
  async getMeetings(year?: number, countryName?: string) {
    const params: Record<string, any> = {};
    if (year) params.year = year;
    if (countryName) params.country_name = countryName;
    
    const response = await this.client.get('/meetings', { params });
    return response.data;
  }

  // Sessions
  async getSessions(meetingKey?: number, year?: number, sessionName?: string) {
    const params: Record<string, any> = {};
    if (meetingKey) params.meeting_key = meetingKey;
    if (year) params.year = year;
    if (sessionName) params.session_name = sessionName;
    
    const response = await this.client.get('/sessions', { params });
    return response.data;
  }

  // Drivers
  async getDrivers(sessionKey: number, driverNumber?: number) {
    const params: Record<string, any> = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    
    const response = await this.client.get('/drivers', { params });
    return response.data;
  }

  // Session Results
  async getSessionResults(sessionKey: number) {
    const response = await this.client.get('/session_result', {
      params: { session_key: sessionKey },
    });
    return response.data;
  }

  // Car Data (Telemetry)
  async getCarData(sessionKey: number, driverNumber: number, dateRange?: { start: string; end: string }) {
    const params: Record<string, any> = {
      session_key: sessionKey,
      driver_number: driverNumber,
    };
    
    if (dateRange) {
      params.date = `${dateRange.start},${dateRange.end}`;
    }
    
    const response = await this.client.get('/car_data', { params });
    return response.data;
  }

  // Lap Data
  async getLaps(sessionKey: number, driverNumber?: number) {
    const params: Record<string, any> = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    
    const response = await this.client.get('/laps', { params });
    return response.data;
  }

  // Position Data
  async getPositions(sessionKey: number) {
    const response = await this.client.get('/position', {
      params: { session_key: sessionKey },
    });
    return response.data;
  }

  // Location Data (for live tracking)
  async getLocation(sessionKey: number, driverNumber?: number) {
    const params: Record<string, any> = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    
    const response = await this.client.get('/location', { params });
    return response.data;
  }

  // Intervals (gaps between drivers)
  async getIntervals(sessionKey: number) {
    const response = await this.client.get('/intervals', {
      params: { session_key: sessionKey },
    });
    return response.data;
  }

  // Driver Standings
  async getDriverStandings(sessionKey: number) {
    const response = await this.client.get('/championship_drivers', {
      params: { session_key: sessionKey },
    });
    return response.data;
  }

  // Constructor Standings
  async getConstructorStandings(sessionKey: number) {
    const response = await this.client.get('/championship_teams', {
      params: { session_key: sessionKey },
    });
    return response.data;
  }

  // Weather Data
  async getWeather(sessionKey: number) {
    const response = await this.client.get('/weather', {
      params: { session_key: sessionKey },
    });
    return response.data;
  }
}

export const openF1Service = new OpenF1Service();