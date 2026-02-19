import { openf1Service } from './openf1Service';
import { cacheService } from './cacheService';
import Year from '../models/Year';
import Meeting from '../models/Meeting';
import Session from '../models/Session';
import Driver from '../models/Driver';
import Result from '../models/Result';
import { logger } from '../utils/logger';
import { sleep, chunkArray } from '../utils/helpers';
import { Op } from 'sequelize';

class DataSyncService {
  private isSyncing: boolean = false;
  private syncProgress: number = 0;

  async syncYear(year: number): Promise<void> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    this.syncProgress = 0;

    try {
      logger.info(`Starting sync for year ${year}`);
      
      // Create or update year record
      await Year.getOrCreate(year);
      
      // Fetch meetings from OpenF1
      const meetings = await openf1Service.fetchMeetings(year);
      const totalMeetings = meetings.length;
      
      for (let i = 0; i < meetings.length; i++) {
        const meetingData = meetings[i];
        this.syncProgress = Math.round((i / totalMeetings) * 100);
        
        logger.info(`Syncing meeting ${i + 1}/${totalMeetings}: ${meetingData.meeting_name}`);
        
        await this.syncMeeting(meetingData, year);
        await sleep(1000); // Be nice to the API
      }

      // Update year stats
      await this.updateYearStats(year);
      
      // Clear cache
      await cacheService.clearPattern(`year:${year}*`);
      
      logger.info(`Completed sync for year ${year}`);
    } catch (error) {
      logger.error(`Sync failed for year ${year}:`, error);
      throw error;
    } finally {
      this.isSyncing = false;
      this.syncProgress = 0;
    }
  }

  private async syncMeeting(meetingData: any, year: number): Promise<void> {
    try {
      // Upsert meeting
      const [meeting, created] = await Meeting.findOrCreate({
        where: { meetingKey: meetingData.meeting_key },
        defaults: {
          meetingKey: meetingData.meeting_key,
          year: year,
          circuitKey: meetingData.circuit_key,
          circuitShortName: meetingData.circuit_short_name,
          circuitType: meetingData.circuit_type,
          countryCode: meetingData.country_code,
          countryName: meetingData.country_name,
          countryFlag: meetingData.country_flag,
          location: meetingData.location,
          meetingName: meetingData.meeting_name,
          meetingOfficialName: meetingData.meeting_official_name,
          dateStart: new Date(meetingData.date_start),
          dateEnd: new Date(meetingData.date_end),
          gmtOffset: meetingData.gmt_offset,
          isCompleted: new Date(meetingData.date_end) < new Date()
        }
      });

      if (!created) {
        await meeting.update({
          isCompleted: new Date(meetingData.date_end) < new Date()
        });
      }

      // Sync sessions for this meeting
      await this.syncSessions(meeting.meetingKey);
      
      // Update winner info if completed
      if (meeting.isCompleted) {
        await meeting.updateWinnerInfo();
      }
    } catch (error) {
      logger.error(`Failed to sync meeting ${meetingData.meeting_key}:`, error);
      throw error;
    }
  }

  private async syncSessions(meetingKey: number): Promise<void> {
    try {
      const sessions = await openf1Service.fetchSessions(meetingKey);
      
      for (const sessionData of sessions) {
        await Session.findOrCreate({
          where: { sessionKey: sessionData.session_key },
          defaults: {
            sessionKey: sessionData.session_key,
            meetingKey: meetingKey,
            circuitKey: sessionData.circuit_key,
            circuitShortName: sessionData.circuit_short_name,
            countryCode: sessionData.country_code,
            countryName: sessionData.country_name,
            year: sessionData.year,
            dateStart: new Date(sessionData.date_start),
            dateEnd: new Date(sessionData.date_end),
            gmtOffset: sessionData.gmt_offset,
            location: sessionData.location,
            sessionName: sessionData.session_name,
            sessionType: sessionData.session_type,
            isCompleted: new Date(sessionData.date_end) < new Date()
          }
        });

        // If session is completed, sync detailed data
        if (new Date(sessionData.date_end) < new Date()) {
          await this.syncSessionDetails(sessionData.session_key);
        }
      }
    } catch (error) {
      logger.error(`Failed to sync sessions for meeting ${meetingKey}:`, error);
    }
  }

  private async syncSessionDetails(sessionKey: number): Promise<void> {
    try {
      // Sync drivers
      const drivers = await openf1Service.fetchDrivers(sessionKey);
      for (const driver of drivers) {
        await Driver.findOrCreate({
          where: { 
            driverNumber: driver.driver_number,
            sessionKey: sessionKey
          },
          defaults: {
            driverNumber: driver.driver_number,
            sessionKey: sessionKey,
            meetingKey: driver.meeting_key,
            broadcastName: driver.broadcast_name,
            firstName: driver.first_name,
            lastName: driver.last_name,
            fullName: driver.full_name,
            nameAcronym: driver.name_acronym,
            teamName: driver.team_name,
            teamColour: driver.team_colour,
            headshotUrl: driver.headshot_url,
            countryCode: driver.country_code
          }
        });
      }

      // Sync results
      const results = await openf1Service.fetchResults(sessionKey);
      for (const result of results) {
        await Result.findOrCreate({
          where: {
            sessionKey: sessionKey,
            driverNumber: result.driver_number
          },
          defaults: {
            sessionKey: sessionKey,
            meetingKey: result.meeting_key,
            driverNumber: result.driver_number,
            position: result.position,
            gridPosition: result.position, // Will be updated from starting grid if available
            q1Time: Array.isArray(result.duration) ? result.duration[0] : null,
            q2Time: Array.isArray(result.duration) ? result.duration[1] : null,
            q3Time: Array.isArray(result.duration) ? result.duration[2] : null,
            raceTime: Array.isArray(result.duration) ? null : result.duration,
            gapToLeader: typeof result.gap_to_leader === 'number' 
              ? `+${result.gap_to_leader}` 
              : result.gap_to_leader,
            numberOfLaps: result.number_of_laps,
            status: result.dnf ? 'DNF' : result.dns ? 'DNS' : result.dsq ? 'DSQ' : 'Finished',
            points: 0, // Will be calculated
            dnf: result.dnf,
            dns: result.dns,
            dsq: result.dsq
          }
        });
      }

      logger.info(`Synced ${drivers.length} drivers and ${results.length} results for session ${sessionKey}`);
    } catch (error) {
      logger.error(`Failed to sync session details for ${sessionKey}:`, error);
    }
  }

  private async updateYearStats(year: number): Promise<void> {
    const yearRecord = await Year.findOne({ where: { year } });
    if (yearRecord) {
      const count = await Meeting.count({ where: { year } });
      await yearRecord.update({ totalRaces: count });
    }
  }

  // Sync only upcoming and live sessions (lightweight)
  async syncCurrentSessions(): Promise<void> {
    try {
      const now = new Date();
      const liveSessions = await Session.findAll({
        where: {
          dateStart: { [Op.lte]: now },
          dateEnd: { [Op.gte]: now }
        }
      });

      for (const session of liveSessions) {
        logger.info(`Syncing live session: ${session.sessionName}`);
        await this.syncSessionDetails(session.sessionKey);
      }

      // Also sync sessions that ended in last hour
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const recentSessions = await Session.findAll({
        where: {
          dateEnd: { [Op.gte]: oneHourAgo, [Op.lte]: now },
          isCompleted: false
        }
      });

      for (const session of recentSessions) {
        logger.info(`Syncing recently completed session: ${session.sessionName}`);
        await this.syncSessionDetails(session.sessionKey);
        await session.update({ isCompleted: true });
      }
    } catch (error) {
      logger.error('Failed to sync current sessions:', error);
    }
  }

  // Get sync status
  getStatus(): { isSyncing: boolean; progress: number } {
    return {
      isSyncing: this.isSyncing,
      progress: this.syncProgress
    };
  }
}

export const dataSyncService = new DataSyncService();
export default dataSyncService;