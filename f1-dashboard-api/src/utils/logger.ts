import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'f1-dashboard-api' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    }),
    // File output - errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), json())
    }),
    // File output - all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: combine(timestamp(), json())
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ]
});

export { logger };