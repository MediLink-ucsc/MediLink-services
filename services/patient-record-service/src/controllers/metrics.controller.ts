import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

const metricsService = new MetricsService();

export const createMetric = async (req: Request, res: Response) => {
  console.log('Received req.body:', req.body);  // <-- Add this line

  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  if (!req.body.date) {
    return res.status(400).json({ message: 'Date field is required' });
  }

  try {
    const saved = await metricsService.createMetric(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Error saving metric:', err);
    res.status(500).json({ message: 'Error saving metric', error: err.message || err });
  }
};



export const getMetrics = async (_req: Request, res: Response) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching metrics', error: err });
  }
};
