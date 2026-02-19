import { Router } from 'express';
import { getYears, getYearById, syncYear, getSyncStatus } from '../controllers/yearsController';
import { strictLimiter, syncLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', getYears);
router.get('/status', getSyncStatus);
router.get('/:year', getYearById);
router.post('/:year/sync', syncLimiter, syncYear);

export default router;