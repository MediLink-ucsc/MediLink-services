import { Router } from 'express';
import { createMetric, getMetrics } from '../controllers/metrics.controller';

const router = Router();

router.post('/', createMetric);
router.get('/', getMetrics);

export default router;
