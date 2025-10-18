interface Config {
  SERVICE_NAME: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  KAFKA_BROKER: string;
  LOG_LEVEL: string;
  ALLOWED_ORIGINS: string;

  // Brevo Email Configuration
  BREVO_API_KEY: string;
  BREVO_SENDER_NAME: string;
  BREVO_SENDER_EMAIL: string;

  // Email Templates Configuration
  FRONTEND_URL: string;
  PASSWORD_RESET_EXPIRY: string;
}

export const config: Config = {
  SERVICE_NAME: require("../../package.json").name,
  PORT: Number(process.env.PORT) || 3005,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://user:password@localhost:5432/notifications",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  KAFKA_BROKER: process.env.KAFKA_BROKER || "localhost:9092",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000",

  // Brevo Configuration - These should be set in environment variables
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || "MediLink Support",
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || "support@medilink.com",

  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  PASSWORD_RESET_EXPIRY: process.env.PASSWORD_RESET_EXPIRY || "15m",
};

// Validate critical environment variables
if (!config.BREVO_API_KEY) {
  console.warn(
    "Warning: BREVO_API_KEY is not set. Email functionality will not work."
  );
}

if (!config.BREVO_SENDER_EMAIL) {
  console.warn(
    "Warning: BREVO_SENDER_EMAIL is not set. Email functionality will not work."
  );
}
