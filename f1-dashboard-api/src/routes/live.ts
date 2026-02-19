import { Router } from 'express';
import { 
  getLiveSessions, 
  getLiveSessionData, 
  subscribeToSession,
  getActiveLiveSessions
} from '../controllers/liveController';

const router = Router();

router.get('/sessions', getLiveSessions);
router.get('/active', getActiveLiveSessions);
router.get('/:sessionKey', getLiveSessionData);
router.post('/:sessionKey/subscribe', subscribeToSession);

export default router;