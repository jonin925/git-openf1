import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from 'dotenv';
import { logger } from '../utils/logger';

config();

const OPENF1_BASE_URL = process.env.OPENF1_BASE_URL || 'https://api.openf1.org/v1';

class OpenF1Client {
  private client: AxiosInstance;
  private rateLimitDelay: number = 1000; // 1 second between requests
  private lastRequestTime: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: OPENF1_BASE_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'F1-Dashboard-API/1.0'
      }
    });

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.rateLimitDelay) {
        await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
      }
      
      this.lastRequestTime = Date.now();
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          logger.warn('Rate limit hit on OpenF1 API');
          this.rateLimitDelay = Math.min(this.rateLimitDelay * 2, 10000);
        }
        return Promise.reject(error);
      }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const config: AxiosRequestConfig = { params };
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  // Specific endpoint methods
  async getMeetings(params?: { year?: number; country_name?: string }): Promise<any[]> {
    return this.get('/meetings', params);
  }

  async getSessions(params?: { meeting_key?: number; year?: number }): Promise<any[]> {
    return this.get('/sessions', params);
  }

  async getDrivers(params?: { session_key?: number; meeting_key?: number }): Promise<any[]> {
    return this.get('/drivers', params);
  }

  async getResults(params?: { session_key?: number; meeting_key?: number }): Promise<any[]> {
    return this.get('/session_result', params);
  }

  async getLaps(params?: { session_key?: number; driver_number?: number }): Promise<any[]> {
    return this.get('/laps', params);
  }

  async getCarData(params?: { session_key?: number; driver_number?: number; speed?: string }): Promise<any[]> {
    return this.get('/car_data', params);
  }

  async getPositions(params?: { session_key?: number; meeting_key?: number }): Promise<any[]> {
    return this.get('/position', params);
  }

  async getWeather(params?: { meeting_key?: number; session_key?: number }): Promise<any[]> {
    return this.get('/weather', params);
  }

  async getPitStops(params?: { session_key?: number; meeting_key?: number }): Promise<any[]> {
    return this.get('/pit', params);
  }

  async getIntervals(params?: { session_key?: number }): Promise<any[]> {
    return this.get('/intervals', params);
  }

  async getTeamRadio(params?: { session_key?: number; driver_number?: number }): Promise<any[]> {
    return this.get('/team_radio', params);
  }

  async getRaceControl(params?: { meeting_key?: number; session_key?: number }): Promise<any[]> {
    return this.get('/race_control', params);
  }

  async getStints(params?: { session_key?: number; meeting_key?: number }): Promise<any[]> {
    return this.get('/stints', params);
  }

  async getOvertakes(params?: { session_key?: number; meeting_key?: number }): Promise<any[]> {
    return this.get('/overtakes', params);
  }

  async getChampionshipDrivers(params?: { session_key?: number; year?: number }): Promise<any[]> {
    return this.get('/championship_drivers', params);
  }

  async getChampionshipTeams(params?: { session_key?: number; year?: number }): Promise<any[]> {
    return this.get('/championship_teams', params);
  }
}

export const openf1Client = new OpenF1Client();
export default openf1Client;