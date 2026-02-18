
import { Server as SocketServer, Socket } from 'socket.io';
import { liveSessionService } from '../services/liveSessionService';
import { logger } from '../utils/logger';

export const initializeWebSocket = (io: SocketServer) => {
  liveSessionService.initialize(io);

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Client joins a session room for live updates
    socket.on('session:subscribe', (sessionKey: number) => {
      const roomName = `session:${sessionKey}`;
      socket.join(roomName);
      logger.info(`Client ${socket.id} subscribed to ${roomName}`);
      
      // Send current active sessions
      socket.emit('live:sessions', liveSessionService.getActiveSessions());
    });

    // Client leaves a session room
    socket.on('session:unsubscribe', (sessionKey: number) => {
      const roomName = `session:${sessionKey}`;
      socket.leave(roomName);
      logger.info(`Client ${socket.id} unsubscribed from ${roomName}`);
    });

    // Admin: Start live tracking for a session
    socket.on('admin:start:tracking', async (data: { 
      sessionKey: number; 
      meetingKey: number; 
      sessionName: string;
    }) => {
      await liveSessionService.startLiveTracking(
        data.sessionKey,
        data.meetingKey,
        data.sessionName
      );
    });

    // Admin: Stop live tracking
    socket.on('admin:stop:tracking', (sessionKey: number) => {
      liveSessionService.stopLiveTracking(sessionKey);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};