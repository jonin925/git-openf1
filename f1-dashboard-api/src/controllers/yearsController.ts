import { Request, Response } from 'express';
import Year from '../models/Year';
import Meeting from '../models/Meeting';
import { cacheService } from '../services/cacheService';
import { dataSyncService } from '../services/dataSyncService';
import { asyncHandler } from '../middleware/errorHandler';
import { YearData, RaceSummary } from '../types';
import { Op } from 'sequelize';

export const getYears = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Try cache first
  const cached = await cacheService.getYears();
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const years = await Year.findAll({
    order: [['year', 'DESC']]
  });

  const data: YearData[] = years.map(y => ({
    id: y.id,
    year: y.year,
    isCurrent: y.isCurrent,
    totalRaces: y.totalRaces
  }));

  await cacheService.setYears(data);
  res.json({ success: true, data });
});

export const getYearById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { year } = req.params;
  const yearNum = parseInt(year);

  if (isNaN(yearNum)) {
    res.status(400).json({ success: false, error: 'Invalid year' });
    return;
  }

  // Try cache
  const cached = await cacheService.getYear(yearNum);
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const yearRecord = await Year.findOne({
    where: { year: yearNum },
    include: [{
      model: Meeting,
      order: [['dateStart', 'ASC']]
    }]
  });

  if (!yearRecord) {
    res.status(404).json({ success: false, error: 'Year not found' });
    return;
  }

  const races: RaceSummary[] = yearRecord.meetings.map(m => ({
    meetingKey: m.meetingKey,
    circuitName: m.circuitShortName,
    countryName: m.countryName,
    countryFlag: m.countryFlag,
    dateStart: m.dateStart.toISOString(),
    isCompleted: m.isCompleted,
    winnerDriver: m.winnerDriverNumber ? undefined : undefined, // Will be populated if available
    winnerConstructor: m.winnerConstructorName || undefined
  }));

  // Populate winner info for completed races
  for (const race of races) {
    if (race.isCompleted) {
      const meeting = yearRecord.meetings.find(m => m.meetingKey === race.meetingKey);
      if (meeting?.winnerDriverNumber) {
        const { default: Driver } = await import('../models/Driver');
        const winner = await Driver.findOne({
          where: { 
            meetingKey: race.meetingKey,
            driverNumber: meeting.winnerDriverNumber
          }
        });
        if (winner) {
          race.winnerDriver = winner.getDisplayName();
        }
      }
    }
  }

  const data: YearData = {
    id: yearRecord.id,
    year: yearRecord.year,
    isCurrent: yearRecord.isCurrent,
    totalRaces: yearRecord.totalRaces,
    races
  };

  await cacheService.setYear(yearNum, data);
  res.json({ success: true, data });
});

export const syncYear = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { year } = req.params;
  const yearNum = parseInt(year);

  if (isNaN(yearNum) || yearNum < 1950 || yearNum > 2030) {
    res.status(400).json({ success: false, error: 'Invalid year' });
    return;
  }

  // Start sync in background
  dataSyncService.syncYear(yearNum).catch(err => {
    console.error(`Background sync failed for year ${yearNum}:`, err);
  });

  res.json({ 
    success: true, 
    message: `Sync started for year ${yearNum}`,
    status: dataSyncService.getStatus()
  });
});

export const getSyncStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.json({ 
    success: true, 
    data: dataSyncService.getStatus() 
  });
});