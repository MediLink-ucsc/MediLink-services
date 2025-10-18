interface Config {
  SERVICE_NAME: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  KAFKA_BROKER: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  LOG_LEVEL: string;
  ALLOWED_ORIGINS: string;
  NOTIFICATION_SERVICE_URL: string;
  FRONTEND_URL: string;
  PASSWORD_RESET_EXPIRY: string;
}

export const config: Config = {
  SERVICE_NAME: require('../../package.json').name,
  PORT: Number(process.env.PORT) || 3001,
  DATABASE_URL:
    process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/auth',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  JWT_SECRET: process.env.AUTH_JWT_SECRET || 'your-default-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  NOTIFICATION_SERVICE_URL:
    process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  PASSWORD_RESET_EXPIRY: process.env.PASSWORD_RESET_EXPIRY || '15m',
};
