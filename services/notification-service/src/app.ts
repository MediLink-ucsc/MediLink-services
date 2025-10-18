import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";

import logger from "./config/logger";
import { AppDataSource } from "./data-source";
import { config } from "./config";
import init from "./init";
import { indexRouter } from "./routes/index.route";
import { emailRouter } from "./routes/email.route";
import { errorHandler } from "./middlewares/error.middleware";
import { reqLogger } from "./middlewares/req.middleware";
import { corsMiddleware } from "./middlewares/cors.middleware";
import { setupGracefulShutdown } from "./utils/shutdown";

const app = express();

// Middlewares
app.use(helmet());
app.use(corsMiddleware);
app.use(reqLogger);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/", indexRouter);
app.use("/api/v1/email", emailRouter);

// Error handling middleware (should be last)
app.use(errorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(async () => {
    logger.info("Database connection established");

    // Run initialization scripts
    await init();

    const server = app.listen(config.PORT, () => {
      logger.info(
        `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`
      );
      logger.info(`Brevo configured: ${!!config.BREVO_API_KEY}`);
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  })
  .catch((err) => {
    logger.error("Error during Data Source initialization:", err);
    process.exit(1);
  });

export default app;
