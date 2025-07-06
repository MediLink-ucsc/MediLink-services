import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import logger from "./config/logger";
import init from "./init";
import { config } from "./config";
import {
  extractionRouter,
  indexRouter,
  reportRouter,
  labWorkflowRouter,
} from "./routes";
import { AppDataSource } from "./data-source";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3004", 10);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/labReport/", indexRouter);
app.use("/api/v1/labReport/extract", extractionRouter);
app.use("/api/v1/labReport/report", reportRouter);
app.use("/api/v1/labReport/workflow", labWorkflowRouter);

// Start server
AppDataSource.initialize()
  .then(async () => {
    await init();
    logger.info("Database connection established successfully");

    app.listen(config.PORT, () => {
      logger.info(
        `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });

export default app;
