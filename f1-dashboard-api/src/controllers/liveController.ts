import { Request, Response } from 'express';
import Session from '../models/Session';
import { liveSessionService } from '../services/liveSessionService';
import { asyncHandler } from '../middleware/errorHandler';

export const getLiveSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const liveSessions = await Session.findLiveSessions();
  
  const data = liveSessions.map(s => ({
    sessionKey: s.sessionKey,
    meetingKey: s.meetingKey,
    name: s.sessionName,
    type: s.sessionType,
    dateStart: s.dateStart,
    dateEnd: s.dateEnd
  }));

  res.json({ success: true, data });
});

export const getLiveSessionData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const session = await Session.findOne({ where: { sessionKey: key } });
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }

  if (!session.isLive()) {
    res.status(400).json({ success: false, error: 'Session is not live' });
    return;
  }

  const liveData = await liveSessionService.getLiveData(key);
  
  if (!liveData) {
    // Start tracking if not already
    await liveSessionService.startLiveTracking(key);
    res.json({ 
      success: true, 
      data: null,
      message: 'Live tracking started, data will be available shortly'
    });
    return;
  }

  res.json({ success: true, data: liveData });
});

export const subscribeToSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  // This endpoint is used by WebSocket to authenticate subscription
  res.json({ 
    success: true, 
    message: `Use WebSocket to subscribe to session:${key}`
  });
});

export const getActiveLiveSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const activeKeys = liveSessionService.getActiveSessions();
  res.json({ success: true, data: activeKeys });
});