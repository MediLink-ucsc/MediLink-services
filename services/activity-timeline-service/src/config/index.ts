import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface Config {
  SERVICE_NAME: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  KAFKA_BROKER: string;
  LOG_LEVEL: string;
  ALLOWED_ORIGINS: string;
  KAFKA_GROUP_ID: string;
}

export const config: Config = {
  SERVICE_NAME: require("../../package.json").name,
  PORT: Number(process.env.PORT) || 3006,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://admin:medilink@localhost:5432/medilink",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  KAFKA_BROKER: process.env.KAFKA_BROKER || "localhost:9092",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "activity-timeline-service",
};
