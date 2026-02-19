import { Router } from 'express';
import { 
  getSessionResults, 
  getDriverStandings, 
  getConstructorStandings,
  getFastestLaps 
} from '../controllers/resultsController';

const router = Router();

router.get('/session/:sessionKey', getSessionResults);
router.get('/fastest-laps/:sessionKey', getFastestLaps);
router.get('/standings/drivers/:meetingKey', getDriverStandings);
router.get('/standings/constructors/:meetingKey', getConstructorStandings);

export default router;