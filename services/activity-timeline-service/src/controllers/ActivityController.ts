import { Request, Response } from "express";
import { ActivityService } from "../services/ActivityService";
import { TimelineQuery } from "../types";
import logger from "../config/logger";
import Joi from "joi";

export class ActivityController {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  getTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const querySchema = Joi.object({
        entityType: Joi.string()
          .valid("user", "institution", "patient", "lab")
          .optional(),
        entityId: Joi.string().optional(),
        activityTypes: Joi.alternatives()
          .try(Joi.string(), Joi.array().items(Joi.string()))
          .optional(),
        startDate: Joi.date().optional(),
        endDate: Joi.date().optional(),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0),
      });

      const { error, value } = querySchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          details: error.details,
        });
        return;
      }

      const query: TimelineQuery = {
        ...value,
        activityTypes: Array.isArray(value.activityTypes)
          ? value.activityTypes
          : value.activityTypes
          ? [value.activityTypes]
          : undefined,
      };

      const timeline = await this.activityService.getTimeline(query);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      logger.error("Error getting timeline:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };

  getEntityActivities = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entityType, entityId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!["user", "institution", "patient", "lab"].includes(entityType)) {
        res.status(400).json({
          success: false,
          error: "Invalid entity type",
        });
        return;
      }

      const activities = await this.activityService.getActivityByEntity(
        entityType,
        entityId,
        limit
      );

      res.json({
        success: true,
        data: {
          entityType,
          entityId,
          activities,
        },
      });
    } catch (error) {
      logger.error("Error getting entity activities:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };

  getHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        service: "activity-timeline-service",
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Health check error:", error);
      res.status(500).json({
        success: false,
        error: "Service unhealthy",
      });
    }
  };
}
