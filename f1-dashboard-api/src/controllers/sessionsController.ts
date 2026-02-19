import { Request, Response } from 'express';
import Session from '../models/Session';
import Driver from '../models/Driver';
import Result from '../models/Result';
import { openf1Service } from '../services/openf1Service';
import { cacheService } from '../services/cacheService';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  PracticeSessionData, QualifyingSessionData, RaceSessionData,
  PracticeDriverData, QualifyingResult, RaceResult 
} from '../types';
import { Op } from 'sequelize';

export const getSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  if (isNaN(key)) {
    res.status(400).json({ success: false, error: 'Invalid session key' });
    return;
  }

  const session = await Session.findOne({
    where: { sessionKey: key }
  });

  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      sessionKey: session.sessionKey,
      meetingKey: session.meetingKey,
      name: session.sessionName,
      type: session.sessionType,
      dateStart: session.dateStart,
      dateEnd: session.dateEnd,
      isCompleted: session.isCompleted,
      isLive: session.isLive()
    }
  });
});

export const getPracticeSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const cached = await cacheService.getSession(key);
  if (cached && !cached.isLive) {
    res.json({ success: true, data: cached });
    return;
  }

  const session = await Session.findOne({ where: { sessionKey: key } });
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }

  // Get drivers with telemetry summary
  const drivers = await Driver.findAll({ where: { sessionKey: key } });
  
  const driverData: PracticeDriverData[] = await Promise.all(
    drivers.map(async (driver) => {
      // Get lap times
      const { default: LapData } = await import('../models/LapData');
      const laps = await LapData.findAll({
        where: { sessionKey: key, driverNumber: driver.driverNumber }
      });

      const lapTimes = laps.map(l => l.lapDuration).filter(t => t > 0);
      const topSpeed = Math.max(...laps.map(l => l.stSpeed || 0), 0);

      // Get telemetry summary
      const telemetryData = await openf1Service.fetchCarData(key, driver.driverNumber);
      const speeds = telemetryData.map(t => t.speed);
      const throttles = telemetryData.map(t => t.throttle);
      const rpms = telemetryData.map(t => t.rpm);

      return {
        driverNumber: driver.driverNumber,
        name: driver.getDisplayName(),
        team: driver.teamName,
        teamColor: driver.getTeamColorHex(),
        headshotUrl: driver.headshotUrl,
        lapTimes: lapTimes.sort((a, b) => a - b),
        topSpeed: topSpeed,
        avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
        telemetry: {
          avgThrottle: throttles.length > 0 ? throttles.reduce((a, b) => a + b, 0) / throttles.length : 0,
          maxThrottle: Math.max(...throttles, 0),
          avgRpm: rpms.length > 0 ? rpms.reduce((a, b) => a + b, 0) / rpms.length : 0,
          maxRpm: Math.max(...rpms, 0),
          speedSamples: telemetryData.slice(-50).map(t => ({
            timestamp: t.date,
            speed: t.speed,
            throttle: t.throttle,
            rpm: t.rpm,
            gear: t.n_gear
          }))
        }
      };
    })
  );

  // Sort by team
  driverData.sort((a, b) => a.team.localeCompare(b.team));

  const data: PracticeSessionData = {
    sessionKey: session.sessionKey,
    meetingKey: session.meetingKey,
    name: session.sessionName,
    type: session.sessionType,
    dateStart: session.dateStart.toISOString(),
    dateEnd: session.dateEnd.toISOString(),
    isCompleted: session.isCompleted,
    drivers: driverData
  };

  await cacheService.setSession(key, data, session.isLive());
  res.json({ success: true, data });
});

export const getQualifyingSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const session = await Session.findOne({ where: { sessionKey: key } });
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }

  const results = await Result.findAll({
    where: { sessionKey: key },
    order: [['position', 'ASC']],
    include: [{
      model: Driver,
      required: false
    }]
  });

  const qualifyingResults: QualifyingResult[] = results.map(r => {
    const driver = r.driver;
    return {
      position: r.position,
      driverNumber: r.driverNumber,
      driverName: driver?.getDisplayName() || '',
      team: driver?.teamName || '',
      teamColor: driver?.getTeamColorHex() || '#000000',
      q1Time: r.q1Time || undefined,
      q2Time: r.q2Time || undefined,
      q3Time: r.q3Time || undefined,
      bestTime: r.getBestQualifyingTime() || undefined
    };
  });

  const data: QualifyingSessionData = {
    sessionKey: session.sessionKey,
    meetingKey: session.meetingKey,
    name: session.sessionName,
    type: session.sessionType,
    dateStart: session.dateStart.toISOString(),
    dateEnd: session.dateEnd.toISOString(),
    isCompleted: session.isCompleted,
    results: qualifyingResults
  };

  res.json({ success: true, data });
});

export const getRaceSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const session = await Session.findOne({ where: { sessionKey: key } });
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }

  const isLive = session.isLive();
  let raceResults: RaceResult[] = [];
  let liveData = undefined;

  if (isLive) {
    // Get live data from service
    const { liveSessionService } = await import('../services/liveSessionService');
    liveData = await liveSessionService.getLiveData(key);
  } else if (session.isCompleted) {
    // Get final results
    const results = await Result.findAll({
      where: { sessionKey: key },
      order: [['position', 'ASC']],
      include: [Driver]
    });

    raceResults = results.map(r => ({
      position: r.position,
      driverNumber: r.driverNumber,
      driverName: r.driver?.getDisplayName() || '',
      team: r.driver?.teamName || '',
      teamColor: r.driver?.getTeamColorHex() || '#000000',
      raceTime: r.raceTime || undefined,
      gap: r.gapToLeader || undefined,
      laps: r.numberOfLaps,
      status: r.status,
      points: r.points
    }));
  }

  const data: RaceSessionData = {
    sessionKey: session.sessionKey,
    meetingKey: session.meetingKey,
    name: session.sessionName,
    type: session.sessionType,
    dateStart: session.dateStart.toISOString(),
    dateEnd: session.dateEnd.toISOString(),
    isCompleted: session.isCompleted,
    isLive,
    results: raceResults.length > 0 ? raceResults : undefined,
    liveData
  };

  res.json({ success: true, data });
});