import { Router } from "express";
import { ActivityController } from "../controllers/ActivityController";

const router = Router();
const activityController = new ActivityController();

// Timeline routes
router.get("/timeline", activityController.getTimeline);
router.get(
  "/entities/:entityType/:entityId/activities",
  activityController.getEntityActivities
);

// Health check
router.get("/health", activityController.getHealthCheck);

export default router;
