import { Request, Response } from 'express';
import Meeting from '../models/Meeting';
import Session from '../models/Session';
import { cacheService } from '../services/cacheService';
import { asyncHandler } from '../middleware/errorHandler';
import { RaceDetail, SessionGroup, MeetingData } from '../types';

export const getMeetings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { year, upcoming } = req.query;
  
  const where: any = {};
  if (year) where.year = parseInt(year as string);
  if (upcoming === 'true') {
    where.dateStart = { $gte: new Date() };
  }

  const meetings = await Meeting.findAll({
    where,
    order: [['dateStart', 'ASC']]
  });

  res.json({ success: true, data: meetings });
});

export const getMeetingByKey = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { meetingKey } = req.params;
  const key = parseInt(meetingKey);

  if (isNaN(key)) {
    res.status(400).json({ success: false, error: 'Invalid meeting key' });
    return;
  }

  // Try cache
  const cached = await cacheService.getMeeting(key);
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const meeting = await Meeting.findOne({
    where: { meetingKey: key },
    include: [Session]
  });

  if (!meeting) {
    res.status(404).json({ success: false, error: 'Meeting not found' });
    return;
  }

  // Group sessions by type
  const sessions: SessionGroup = {
    practice: [],
    qualifying: null,
    sprintQualifying: null,
    sprintRace: null,
    race: null
  };

  for (const session of meeting.sessions) {
    const sessionData = {
      sessionKey: session.sessionKey,
      meetingKey: session.meetingKey,
      name: session.sessionName,
      type: session.sessionType,
      dateStart: session.dateStart.toISOString(),
      dateEnd: session.dateEnd.toISOString(),
      isCompleted: session.isCompleted
    };

    const category = session.getCategory();
    switch (category) {
      case 'practice':
        sessions.practice.push(sessionData);
        break;
      case 'qualifying':
        sessions.qualifying = sessionData;
        break;
      case 'sprint_qualifying':
        sessions.sprintQualifying = sessionData;
        break;
      case 'sprint_race':
        sessions.sprintRace = sessionData;
        break;
      case 'race':
        sessions.race = sessionData;
        break;
    }
  }

  const meetingData: MeetingData = {
    meetingKey: meeting.meetingKey,
    year: meeting.year,
    circuitName: meeting.circuitShortName,
    circuitType: meeting.circuitType,
    countryName: meeting.countryName,
    countryCode: meeting.countryCode,
    location: meeting.location,
    dateStart: meeting.dateStart.toISOString(),
    dateEnd: meeting.dateEnd.toISOString(),
    isCompleted: meeting.isCompleted
  };

  const data: RaceDetail = {
    meeting: meetingData,
    sessions
  };

  await cacheService.setMeeting(key, data);
  res.json({ success: true, data });
});

export const getMeetingWinners = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { meetingKey } = req.params;
  const key = parseInt(meetingKey);

  const meeting = await Meeting.findByPk(key);
  if (!meeting) {
    res.status(404).json({ success: false, error: 'Meeting not found' });
    return;
  }

  // Get race session
  const raceSession = await Session.findOne({
    where: { 
      meetingKey: key,
      sessionType: 'Race'
    }
  });

  if (!raceSession) {
    res.json({ success: true, data: null });
    return;
  }

  // Get winner from results
  const { default: Result } = await import('../models/Result');
  const winner = await Result.findOne({
    where: { 
      sessionKey: raceSession.sessionKey,
      position: 1
    }
  });

  if (!winner) {
    res.json({ success: true, data: null });
    return;
  }

  const { default: Driver } = await import('../models/Driver');
  const driver = await Driver.findOne({
    where: {
      driverNumber: winner.driverNumber,
      meetingKey: key
    }
  });

  res.json({
    success: true,
    data: {
      driver: driver?.getDisplayName(),
      driverNumber: winner.driverNumber,
      constructor: driver?.teamName,
      raceTime: winner.getFormattedRaceTime()
    }
  });
});