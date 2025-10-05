import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { config } from "./config";
import logger from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./database";
import { KafkaConsumerService } from "./events/KafkaConsumerService";

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// Routes
app.use("/api/v1/activity", routes);

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
  });
});

// Initialize Kafka consumer service
const kafkaConsumerService = new KafkaConsumerService();

// Graceful shutdown handling
const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");

  try {
    await kafkaConsumerService.stopConsumers();
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start Kafka consumers
    await kafkaConsumerService.startConsumers();

    // Start HTTP server
    app.listen(config.PORT, () => {
      logger.info(`${config.SERVICE_NAME} started on port ${config.PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
