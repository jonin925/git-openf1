import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  },
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  }
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded for this endpoint.'
    });
  }
});

export const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Sync operations limited to 5 per hour.'
    });
  }
});