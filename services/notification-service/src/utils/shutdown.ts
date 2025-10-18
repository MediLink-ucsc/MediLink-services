import { Server } from "http";
import logger from "../config/logger";
import { AppDataSource } from "../data-source";

export const setupGracefulShutdown = (server: Server): void => {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error("Error during server shutdown:", err);
        process.exit(1);
      }

      try {
        // Close database connection
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info("Database connection closed");
        }

        logger.info("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        logger.error("Error during graceful shutdown:", error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error("Force shutdown after timeout");
      process.exit(1);
    }, 30000);
  };

  // Listen for termination signals
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    gracefulShutdown("uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("unhandledRejection");
  });
};
