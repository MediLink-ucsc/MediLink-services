import express from "express";
import { LabWorkflowController } from "../controllers/labWorkflow.controller";
import upload from "../middleware/upload.middleware";
import { verifyToken } from "../middleware/auth.middleware";

const labWorkflowRouter = express.Router();
const labWorkflowController = new LabWorkflowController();

// Lab Sample Management
labWorkflowRouter.post(
  "/samples",
  labWorkflowController.createLabSample.bind(labWorkflowController)
);

labWorkflowRouter.get(
  "/samples",
  labWorkflowController.getLabSamples.bind(labWorkflowController)
);

// Get lab samples by lab ID (from token)
labWorkflowRouter.get(
  "/lab/samples",
  verifyToken,
  labWorkflowController.getLabSamplesByLabId.bind(labWorkflowController)
);

// Get lab samples by specific lab ID (with authorization)
labWorkflowRouter.get(
  "/lab/:labId/samples",
  verifyToken,
  labWorkflowController.getLabSamplesBySpecificLabId.bind(labWorkflowController)
);

// Debug endpoint to check token information
labWorkflowRouter.get(
  "/debug/token",
  verifyToken,
  labWorkflowController.debugTokenInfo.bind(labWorkflowController)
);

labWorkflowRouter.get(
  "/samples/:labSampleId",
  labWorkflowController.getLabSampleWithResults.bind(labWorkflowController)
);

labWorkflowRouter.patch(
  "/samples/:labSampleId",
  labWorkflowController.updateLabSample.bind(labWorkflowController)
);

// Lab Report Processing
labWorkflowRouter.post(
  "/samples/:labSampleId/process-report",
  upload.single("reportFilePath"),
  labWorkflowController.processLabReport.bind(labWorkflowController)
);

// Patient Lab History
labWorkflowRouter.get(
  "/patients/:patientId/history",
  labWorkflowController.getPatientLabHistory.bind(labWorkflowController)
);

// Lab Result Management
labWorkflowRouter.get(
  "/results/:resultId",
  verifyToken,
  labWorkflowController.getLabResult.bind(labWorkflowController)
);

labWorkflowRouter.put(
  "/results/:resultId/edit",
  labWorkflowController.editLabResult.bind(labWorkflowController)
);

// Get all lab results (admin only)
labWorkflowRouter.get(
  "/results",
  verifyToken,
  labWorkflowController.getAllLabResults.bind(labWorkflowController)
);

// Get lab results by lab ID (from token)
labWorkflowRouter.get(
  "/lab/results",
  verifyToken,
  labWorkflowController.getLabResultsByLabId.bind(labWorkflowController)
);

// Get lab results by specific lab ID (with authorization)
labWorkflowRouter.get(
  "/lab/:labId/results",
  verifyToken,
  labWorkflowController.getLabResultsBySpecificLabId.bind(labWorkflowController)
);

// Get lab dashboard statistics (from token)
labWorkflowRouter.get(
  "/lab/dashboard/stats",
  verifyToken,
  labWorkflowController.getLabDashboardStats.bind(labWorkflowController)
);

// Get lab dashboard statistics by specific lab ID (with authorization)
labWorkflowRouter.get(
  "/lab/:labId/dashboard/stats",
  verifyToken,
  labWorkflowController.getLabDashboardStats.bind(labWorkflowController)
);

export { labWorkflowRouter };
