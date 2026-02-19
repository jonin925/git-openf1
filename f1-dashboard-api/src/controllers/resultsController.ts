import { Request, Response } from 'express';
import Result from '../models/Result';
import Session from '../models/Session';
import Meeting from '../models/Meeting';
import { openf1Service } from '../services/openf1Service';
import { asyncHandler } from '../middleware/errorHandler';
import { Op } from 'sequelize';

export const getSessionResults = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const results = await Result.findAll({
    where: { sessionKey: key },
    order: [['position', 'ASC']]
  });

  res.json({ success: true, data: results });
});

export const getDriverStandings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { meetingKey } = req.params;
  const key = parseInt(meetingKey);

  // Get race session for this meeting
  const raceSession = await Session.findOne({
    where: { 
      meetingKey: key,
      sessionType: 'Race'
    }
  });

  if (!raceSession) {
    res.status(404).json({ success: false, error: 'Race session not found' });
    return;
  }

  // Try to get from API first for most current data
  try {
    const standings = await openf1Service.fetchDriverStandings(raceSession.sessionKey);
    if (standings && standings.length > 0) {
      res.json({ success: true, data: standings });
      return;
    }
  } catch (error) {
    // Fall back to database
  }

  // Get from database
  const { default: DriverStanding } = await import('../models/DriverStandings');
  const standings = await DriverStanding.findAll({
    where: { meetingKey: key },
    order: [['position', 'ASC']]
  });

  res.json({ success: true, data: standings });
});

export const getConstructorStandings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { meetingKey } = req.params;
  const key = parseInt(meetingKey);

  const raceSession = await Session.findOne({
    where: { 
      meetingKey: key,
      sessionType: 'Race'
    }
  });

  if (!raceSession) {
    res.status(404).json({ success: false, error: 'Race session not found' });
    return;
  }

  try {
    const standings = await openf1Service.fetchConstructorStandings(raceSession.sessionKey);
    if (standings && standings.length > 0) {
      res.json({ success: true, data: standings });
      return;
    }
  } catch (error) {
    // Fall back to database
  }

  const { default: ConstructorStanding } = await import('../models/ConstructorStandings');
  const standings = await ConstructorStanding.findAll({
    where: { meetingKey: key },
    order: [['position', 'ASC']]
  });

  res.json({ success: true, data: standings });
});

export const getFastestLaps = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const { default: LapData } = await import('../models/LapData');
  const laps = await LapData.findAll({
    where: { sessionKey: key },
    order: [['lapDuration', 'ASC']],
    limit: 10
  });

  res.json({ success: true, data: laps });
});