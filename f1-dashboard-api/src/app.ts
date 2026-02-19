import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { createServer } from 'http';

import { testConnection, syncDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

import yearsRoutes from './routes/years';
import meetingsRoutes from './routes/meetings';
import sessionsRoutes from './routes/sessions';
import resultsRoutes from './routes/results';
import telemetryRoutes from './routes/telemetry';
import liveRoutes from './routes/live';

import { initializeSocketIO } from './websocket/liveSocket';
import { liveSessionService } from './services/liveSessionService';
import { dataSyncService } from './services/dataSyncService';

// Load environment variables
config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket
try {
  initializeSocketIO(server);
} catch (error) {
  logger.warn('WebSocket initialization failed:', error);
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/years', yearsRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/live', liveRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database initialization and server start
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models (alter in dev, no force in production)
    await syncDatabase(process.env.NODE_ENV === 'development');
    
    // Connect to Redis (optional)
    await connectRedis();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 F1 Dashboard API running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start live session detection
    setInterval(() => {
      liveSessionService.detectAndStartLiveSessions();
    }, 60000);

    // Initial detection
    liveSessionService.detectAndStartLiveSessions();

    // Periodic sync of current sessions
    setInterval(() => {
      dataSyncService.syncCurrentSessions();
    }, 300000);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

startServer();