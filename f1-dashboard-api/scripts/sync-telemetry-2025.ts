import { openf1Service } from '../src/services/openf1Service';
import { dataSyncService } from '../src/services/dataSyncService';
import Meeting from '../src/models/Meeting';
import Session from '../src/models/Session';
import Driver from '../src/models/Driver';
import { logger } from '../src/utils/logger';
import { sleep } from '../src/utils/helpers';
import sequelize from '../src/config/database';

interface TelemetrySyncProgress {
  currentRace: number;
  totalRaces: number;
  currentSession: string;
  currentDriver?: number;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  errors: string[];
}

class TelemetrySync2025 {
  private progress: TelemetrySyncProgress = {
    currentRace: 0,
    totalRaces: 0,
    currentSession: '',
    status: 'idle',
    errors: []
  };

  async initialize(): Promise<void> {
    await sequelize.authenticate();
    logger.info('Database connected for telemetry sync');
  }

  async get2025Races(): Promise<Meeting[]> {
    const races = await Meeting.findAll({
      where: { year: 2025 },
      order: [['dateStart', 'ASC']],
      include: [{
        model: Session,
        order: [['dateStart', 'ASC']]
      }]
    });
    
    this.progress.totalRaces = races.length;
    logger.info(`Found ${races.length} races for 2025`);
    
    return races;
  }

  async syncRaceTelemetry(race: Meeting, raceIndex: number): Promise<void> {
    this.progress.currentRace = raceIndex + 1;
    logger.info(`\n========================================`);
    logger.info(`Processing Race ${raceIndex + 1}/${this.progress.totalRaces}: ${race.meetingName}`);
    logger.info(`Circuit: ${race.circuitShortName}`);
    logger.info(`Date: ${race.dateStart}`);
    logger.info(`========================================\n`);

    // Process each session type in order
    const sessionOrder = ['Practice 1', 'Practice 2', 'Practice 3', 'Qualifying', 'Sprint Qualifying', 'Sprint', 'Race'];
    
    for (const sessionType of sessionOrder) {
      const sessions = race.sessions?.filter(s => 
        s.sessionName === sessionType || s.sessionType === sessionType
      ) || [];

      for (const session of sessions) {
        await this.syncSessionTelemetry(session, race);
      }
    }
  }

  async syncSessionTelemetry(session: Session, race: Meeting): Promise<void> {
    this.progress.currentSession = session.sessionName;
    logger.info(`\n--- Session: ${session.sessionName} (Key: ${session.sessionKey}) ---`);

    try {
      // Check if session is completed or live
      const isCompleted = session.isCompleted || new Date() > new Date(session.dateEnd);
      const isLive = session.isLive();

      if (!isCompleted && !isLive) {
        logger.info(`Session not started yet, skipping...`);
        return;
      }

      // Step 1: Sync drivers for this session
      logger.info(`Fetching drivers...`);
      const drivers = await this.syncSessionDrivers(session);
      
      if (drivers.length === 0) {
        logger.warn(`No drivers found for session ${session.sessionKey}`);
        return;
      }

      // Step 2: Sync lap data for all drivers
      logger.info(`Syncing lap data for ${drivers.length} drivers...`);
      await this.syncLapData(session, drivers);

      // Step 3: Sync car telemetry (throttle, brake, speed, RPM, DRS)
      logger.info(`Syncing car telemetry...`);
      await this.syncCarTelemetry(session, drivers);

      // Step 4: Sync positions (for race sessions)
      if (session.sessionType === 'Race' || session.sessionName === 'Race') {
        logger.info(`Syncing race positions...`);
        await this.syncPositions(session);
      }

      // Step 5: Sync weather data
      logger.info(`Syncing weather data...`);
      await this.syncWeather(session);

      // Step 6: Sync pit stops (for race/sprint)
      if (session.sessionType === 'Race' || session.sessionName === 'Race' || 
          session.sessionType === 'Sprint' || session.sessionName === 'Sprint') {
        logger.info(`Syncing pit stops...`);
        await this.syncPitStops(session);
      }

      // Step 7: Sync intervals (for race sessions)
      if (session.sessionType === 'Race' || session.sessionName === 'Race') {
        logger.info(`Syncing intervals...`);
        await this.syncIntervals(session);
      }

      logger.info(`✅ Completed session: ${session.sessionName}`);

    } catch (error) {
      const errorMsg = `Failed to sync session ${session.sessionKey}: ${error}`;
      logger.error(errorMsg);
      this.progress.errors.push(errorMsg);
    }

    // Rate limiting - be nice to OpenF1 API
    await sleep(2000);
  }

  async syncSessionDrivers(session: Session): Promise<Driver[]> {
    try {
      const existingDrivers = await Driver.findAll({
        where: { sessionKey: session.sessionKey }
      });

      if (existingDrivers.length > 0) {
        logger.info(`Found ${existingDrivers.length} existing drivers in DB`);
        return existingDrivers;
      }

      // Fetch from API
      const drivers = await openf1Service.fetchDrivers(session.sessionKey);
      
      for (const driver of drivers) {
        await Driver.findOrCreate({
          where: { 
            driverNumber: driver.driver_number,
            sessionKey: session.sessionKey
          },
          defaults: {
            driverNumber: driver.driver_number,
            sessionKey: session.sessionKey,
            meetingKey: session.meetingKey,
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

      logger.info(`Synced ${drivers.length} drivers`);
      return Driver.findAll({ where: { sessionKey: session.sessionKey } });
    } catch (error) {
      logger.error(`Failed to sync drivers:`, error);
      return [];
    }
  }

  async syncLapData(session: Session, drivers: Driver[]): Promise<void> {
    const { default: LapData } = await import('../src/models/LapData');
    
    for (const driver of drivers) {
      try {
        const laps = await openf1Service.fetchLaps(session.sessionKey, driver.driverNumber);
        
        for (const lap of laps) {
          await LapData.findOrCreate({
            where: {
              sessionKey: session.sessionKey,
              driverNumber: driver.driverNumber,
              lapNumber: lap.lap_number
            },
            defaults: {
              sessionKey: session.sessionKey,
              driverNumber: driver.driverNumber,
              lapNumber: lap.lap_number,
              lapDuration: lap.lap_duration,
              durationSector1: lap.duration_sector_1,
              durationSector2: lap.duration_sector_2,
              durationSector3: lap.duration_sector_3,
              i1Speed: lap.i1_speed,
              i2Speed: lap.i2_speed,
              stSpeed: lap.st_speed,
              isPitOutLap: lap.is_pit_out_lap,
              segmentsSector1: lap.segments_sector_1 || [],
              segmentsSector2: lap.segments_sector_2 || [],
              segmentsSector3: lap.segments_sector_3 || []
            }
          });
        }

        if (laps.length > 0) {
          logger.info(`  Driver ${driver.driverNumber} (${driver.nameAcronym}): ${laps.length} laps`);
        }
        
        await sleep(500); // Rate limit between drivers
      } catch (error) {
        logger.warn(`  Failed to fetch laps for driver ${driver.driverNumber}:`, error);
      }
    }
  }

  async syncCarTelemetry(session: Session, drivers: Driver[]): Promise<void> {
    const { default: TelemetryData } = await import('../src/models/TelemetryData');
    
    // For practice/qualifying, get all telemetry
    // For races, get samples to avoid too much data
    const isRace = session.sessionType === 'Race' || session.sessionName === 'Race';
    const sampleRate = isRace ? 10 : 1; // Every 10th sample for races

    for (const driver of drivers) {
      try {
        const carData = await openf1Service.fetchCarData(session.sessionKey, driver.driverNumber);
        
        // Filter samples
        const samples = carData.filter((_, index) => index % sampleRate === 0);
        
        // Batch insert for performance
        const batchSize = 1000;
        for (let i = 0; i < samples.length; i += batchSize) {
          const batch = samples.slice(i, i + batchSize);
          
          await TelemetryData.bulkCreate(
            batch.map(d => ({
              sessionKey: session.sessionKey,
              driverNumber: driver.driverNumber,
              date: new Date(d.date),
              speed: d.speed,
              rpm: d.rpm,
              throttle: d.throttle,
              brake: d.brake,
              drs: d.drs,
              nGear: d.n_gear
            })),
            { ignoreDuplicates: true }
          );
        }

        logger.info(`  Driver ${driver.driverNumber}: ${samples.length} telemetry samples (from ${carData.length} total)`);
        await sleep(1000); // Rate limit - car data is heavy
      } catch (error) {
        logger.warn(`  Failed to fetch car data for driver ${driver.driverNumber}:`, error);
      }
    }
  }

  async syncPositions(session: Session): Promise<void> {
    try {
      const positions = await openf1Service.fetchPositions(session.sessionKey);
      
      // Store in cache or database as needed
      logger.info(`  Fetched ${positions.length} position updates`);
    } catch (error) {
      logger.warn(`  Failed to fetch positions:`, error);
    }
  }

  async syncWeather(session: Session): Promise<void> {
    const { default: WeatherData } = await import('../src/models/WeatherData');
    
    try {
      const weather = await openf1Service.fetchWeather(session.sessionKey);
      
      for (const w of weather) {
        await WeatherData.findOrCreate({
          where: {
            sessionKey: session.sessionKey,
            date: new Date(w.date)
          },
          defaults: {
            sessionKey: session.sessionKey,
            meetingKey: session.meetingKey,
            date: new Date(w.date),
            airTemperature: w.air_temperature,
            trackTemperature: w.track_temperature,
            humidity: w.humidity,
            pressure: w.pressure,
            windSpeed: w.wind_speed,
            windDirection: w.wind_direction,
            rainfall: w.rainfall
          }
        });
      }

      logger.info(`  Synced ${weather.length} weather records`);
    } catch (error) {
      logger.warn(`  Failed to fetch weather:`, error);
    }
  }

  async syncPitStops(session: Session): Promise<void> {
    const { default: PitStop } = await import('../src/models/PitStops');
    
    try {
      const pits = await openf1Service.fetchPitStops(session.sessionKey);
      
      for (const pit of pits) {
        await PitStop.findOrCreate({
          where: {
            sessionKey: session.sessionKey,
            driverNumber: pit.driver_number,
            lapNumber: pit.lap_number
          },
          defaults: {
            sessionKey: session.sessionKey,
            driverNumber: pit.driver_number,
            lapNumber: pit.lap_number,
            pitDuration: pit.pit_duration || pit.lane_duration,
            stopDuration: pit.stop_duration,
            date: new Date(pit.date)
          }
        });
      }

      logger.info(`  Synced ${pits.length} pit stops`);
    } catch (error) {
      logger.warn(`  Failed to fetch pit stops:`, error);
    }
  }

  async syncIntervals(session: Session): Promise<void> {
    try {
      const intervals = await openf1Service.fetchIntervals(session.sessionKey);
      logger.info(`  Fetched ${intervals.length} interval updates`);
    } catch (error) {
      logger.warn(`  Failed to fetch intervals:`, error);
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      
      // First ensure basic data is synced
      logger.info('Step 1: Syncing basic 2025 season data...');
      await dataSyncService.syncYear(2025);
      
      // Then get detailed telemetry
      logger.info('\nStep 2: Starting detailed telemetry sync...');
      const races = await this.get2025Races();
      
      this.progress.status = 'syncing';
      
      for (let i = 0; i < races.length; i++) {
        await this.syncRaceTelemetry(races[i], i);
        
        // Pause between races to avoid rate limits
        if (i < races.length - 1) {
          logger.info(`\n⏳ Pausing 5 seconds before next race...`);
          await sleep(5000);
        }
      }

      this.progress.status = 'completed';
      logger.info(`\n\n✅ Telemetry sync completed!`);
      logger.info(`Total races processed: ${this.progress.totalRaces}`);
      
      if (this.progress.errors.length > 0) {
        logger.warn(`\nErrors encountered (${this.progress.errors.length}):`);
        this.progress.errors.forEach(e => logger.warn(`  - ${e}`));
      }

    } catch (error) {
      this.progress.status = 'error';
      logger.error('Fatal error during sync:', error);
      throw error;
    } finally {
      await sequelize.close();
    }
  }

  getProgress(): TelemetrySyncProgress {
    return this.progress;
  }
}

// Run if called directly
if (require.main === module) {
  const sync = new TelemetrySync2025();
  sync.run().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
}

export { TelemetrySync2025 };