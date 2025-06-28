import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import logger from "./config/logger";
import { config } from "./config";
import { extractionRouter, indexRouter } from "./routes";

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "3004", 10);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/", indexRouter);
app.use("/api/v1/labReport/", extractionRouter);

// Start server
app.listen(PORT, () => {
  logger.info(`${config.SERVICE_NAME} is running on http://localhost:${PORT}`);
});

export default app;
