import express from "express";
import { LabWorkflowController } from "../controllers/labWorkflow.controller";
import upload from "../middleware/upload.middleware";

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

export { labWorkflowRouter };
