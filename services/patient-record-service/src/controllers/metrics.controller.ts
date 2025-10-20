import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

const metricsService = new MetricsService();

export const createMetric = async (req: Request, res: Response) => {
  const { userId } = req.params; // get userId from URL
  const data = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required in URL' });
  }

  if (!data.date) {
    return res.status(400).json({ message: 'Date field is required' });
  }

  if (data.weight === undefined || data.weight === null) {
    return res.status(400).json({ message: 'Weight field is required' });
  }

  try {
    const saved = await metricsService.createMetric({ ...data, userId });
    console.log('Metric saved successfully:', saved);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Error saving metric:', err);
    res
      .status(500)
      .json({ message: 'Error saving metric', error: err.message || err });
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
