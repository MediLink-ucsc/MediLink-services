import { Router } from 'express';
import { createMetric, getMetrics } from '../controllers/metrics.controller';

const router = Router();


router.post('/users/:userId/metrics', createMetric);


router.get('/metrics', getMetrics);

export default router;
