import { Router } from 'express';
import { 
  getCarData, 
  getLapData, 
  getPositions, 
  getWeather,
  getPitStops,
  getDriverComparison
} from '../controllers/telemetryController';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();

// Stricter limits on telemetry endpoints due to data volume
router.get('/car-data/:sessionKey', strictLimiter, getCarData);
router.get('/laps/:sessionKey', getLapData);
router.get('/positions/:sessionKey', getPositions);
router.get('/weather/:sessionKey', getWeather);
router.get('/pit-stops/:sessionKey', getPitStops);
router.get('/compare/:sessionKey', strictLimiter, getDriverComparison);

export default router;