import { DataSource } from "typeorm";
import logger from "../config/logger";
import { config } from "../config";
import { ActivityEvent } from "../entity/ActivityEvent";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: config.DATABASE_URL,
  synchronize: false, // Disable for now to avoid conflicts
  logging: process.env.NODE_ENV === "development",
  entities: [ActivityEvent],
  schema: "activity_timeline", // Use a separate schema
});

export const connectDatabase = async (): Promise<void> => {
  try {
    // Initialize the data source
    await AppDataSource.initialize();

    // Drop and recreate schema to ensure clean state
    await AppDataSource.query(
      `DROP SCHEMA IF EXISTS activity_timeline CASCADE`
    );
    await AppDataSource.query(`CREATE SCHEMA activity_timeline`);

    // Now sync the database schema
    await AppDataSource.synchronize();

    logger.info(
      "Connected to PostgreSQL database with fresh activity_timeline schema"
    );
  } catch (error) {
    logger.error("Failed to connect to PostgreSQL database:", error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info("Disconnected from PostgreSQL database");
    }
  } catch (error) {
    logger.error("Failed to disconnect from PostgreSQL database:", error);
  }
};
