import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    statusCode,
  });

  if (process.env.NODE_ENV === "development") {
    res.status(statusCode).json({
      success: false,
      message,
      error: err.message,
      stack: err.stack,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? "Internal Server Error" : message,
    });
  }
};
