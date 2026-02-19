import { Router } from 'express';
import { 
  getSession, 
  getPracticeSession, 
  getQualifyingSession, 
  getRaceSession 
} from '../controllers/sessionsController';

const router = Router();

router.get('/:sessionKey', getSession);
router.get('/:sessionKey/practice', getPracticeSession);
router.get('/:sessionKey/qualifying', getQualifyingSession);
router.get('/:sessionKey/race', getRaceSession);

export default router;