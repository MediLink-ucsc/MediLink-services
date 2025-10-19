import { AppDataSource } from '../data-source';
import { Metric } from '../entity/metric.entity';

export class MetricsService {
  private repo = AppDataSource.getRepository(Metric);

  async createMetric(data: Partial<Metric>) {
    // Check if database is connected
    if (!AppDataSource.isInitialized) {
      throw new Error('Database connection not initialized');
    }
    if (!data.userId) {
      throw new Error("userId is required");
    }
    if (!data.date) {
      throw new Error("Date is required");
    }
    if (data.weight === undefined || data.weight === null) {
      throw new Error("Weight is required");
    }

    // Use transaction for data consistency
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const metric = this.repo.create(data);
      const savedMetric = await queryRunner.manager.save(metric);
      await queryRunner.commitTransaction();
      console.log('Transaction committed successfully');
      return savedMetric;
    } catch (error) {
      console.error('Error saving metric:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getMetrics() {
    return this.repo.find({ order: { date: 'ASC' } });
  }
}
