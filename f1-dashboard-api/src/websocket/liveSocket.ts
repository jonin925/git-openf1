import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { liveSessionService } from '../services/liveSessionService';
import { logger } from '../utils/logger';

let io: SocketServer;

export const initializeSocketIO = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle session subscription
    socket.on('subscribe', (sessionKey: number) => {
      const room = `session:${sessionKey}`;
      socket.join(room);
      logger.info(`Client ${socket.id} subscribed to ${room}`);
      
      // Start live tracking if not already
      liveSessionService.startLiveTracking(sessionKey);
      
      // Send immediate acknowledgment
      socket.emit('subscribed', { sessionKey, room });
    });

    // Handle unsubscription
    socket.on('unsubscribe', (sessionKey: number) => {
      const room = `session:${sessionKey}`;
      socket.leave(room);
      logger.info(`Client ${socket.id} unsubscribed from ${room}`);
      
      // Check if anyone else is in the room
      const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
      if (roomSize === 0) {
        liveSessionService.stopLiveTracking(sessionKey);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      
      // Clean up any sessions this socket was tracking
      for (const [key, interval] of liveSessionService.getActiveSessions().entries()) {
        const room = `session:${key}`;
        const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
        if (roomSize === 0) {
          liveSessionService.stopLiveTracking(key);
        }
      }
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const broadcastToSession = (sessionKey: number, event: string, data: any): void => {
  if (io) {
    io.to(`session:${sessionKey}`).emit(event, data);
  }
};