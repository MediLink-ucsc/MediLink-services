import { AppDataSource } from '../data-source';
import { Metric } from '../entity/metric.entity';

export class MetricsService {
  private repo = AppDataSource.getRepository(Metric);

 async createMetric(data: Partial<Metric>) {
      console.log('createMetric data:', data);

  if (!data.date) {
    throw new Error("Date is required");
  }
  if (data.weight === undefined || data.weight === null) {
    throw new Error("Weight is required");
  }
  const metric = this.repo.create(data);
  return this.repo.save(metric);
}


  async getMetrics() {
    return this.repo.find({ order: { date: 'ASC' } });
  }
}
