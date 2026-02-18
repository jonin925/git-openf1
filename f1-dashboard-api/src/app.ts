
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { initializeWebSocket } from './websocket/liveSocket';

// Routes
import yearsRouter from './routes/years';
import meetingsRouter from './routes/meetings';
import sessionsRouter from './routes/sessions';
import resultsRouter from './routes/results';
import telemetryRouter from './routes/telemetry';
import liveRouter from './routes/live';

import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(rateLimiter);

// API Routes
app.use('/api/years', yearsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/live', liveRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize WebSocket
initializeWebSocket(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export { app, io };