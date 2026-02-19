import { Router } from 'express';
import { getMeetings, getMeetingByKey, getMeetingWinners } from '../controllers/meetingsController';

const router = Router();

router.get('/', getMeetings);
router.get('/:meetingKey', getMeetingByKey);
router.get('/:meetingKey/winners', getMeetingWinners);

export default router;