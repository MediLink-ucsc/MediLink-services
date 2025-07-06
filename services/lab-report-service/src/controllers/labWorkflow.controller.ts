import { Request, Response } from "express";
import { labWorkflowService } from "../services/labWorkflow.service";
import { reportHandlerService } from "../services/reportHandler.service";

interface ExtractRequest extends Request {
  file?: Express.Multer.File;
  body: {
    filePath?: string;
    fileFormat: string;
  };
}

export class LabWorkflowController {
  // Create a new lab sample
  async createLabSample(req: Request, res: Response): Promise<void> {
    try {
      const {
        labId,
        barcode,
        testTypeId,
        sampleType,
        volume,
        container,
        patientId,
        expectedTime,
        priority,
        notes,
      } = req.body;

      // Validation
      if (
        !labId ||
        !barcode ||
        !testTypeId ||
        !sampleType ||
        !patientId ||
        !expectedTime
      ) {
        res.status(400).json({
          success: false,
          message:
            "Required fields: labId, barcode, testTypeId, sampleType, patientId, expectedTime",
        });
        return;
      }

      const labSample = await labWorkflowService.createLabSample({
        labId,
        barcode,
        testTypeId: parseInt(testTypeId),
        sampleType,
        volume,
        container,
        patientId,
        expectedTime: new Date(expectedTime),
        priority,
        notes,
      });

      res.status(201).json({
        success: true,
        data: labSample,
        message: "Lab sample created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create lab sample",
      });
    }
  }

  // Process lab report for a specific lab sample
  async processLabReport(req: ExtractRequest, res: Response): Promise<void> {
    try {
      const { labSampleId } = req.params;

      const reportFilePath = req.file ? req.file.path : req.body.filePath;

      if (!reportFilePath) {
        res.status(400).json({
          success: false,
          message: "File upload or reportFilePath is required",
        });
        return;
      }

      console.log(`Processing report: ${reportFilePath}`);

      const labResult = await labWorkflowService.processLabReport(
        parseInt(labSampleId),
        reportFilePath
      );

      res.status(200).json({
        success: true,
        data: labResult,
        message: "Lab report processed successfully",
      });
    } catch (error) {
      console.error("Error in processLabReport:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process lab report",
      });
    }
  }

  // Get patient's complete lab history
  async getPatientLabHistory(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      const history = await labWorkflowService.getPatientLabHistory(patientId);

      res.status(200).json({
        success: true,
        data: history,
        message: "Patient lab history retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get patient lab history",
      });
    }
  }

  // Get lab sample with results
  async getLabSampleWithResults(req: Request, res: Response): Promise<void> {
    try {
      const { labSampleId } = req.params;

      const sampleData = await labWorkflowService.getLabSampleWithResults(
        parseInt(labSampleId)
      );

      res.status(200).json({
        success: true,
        data: sampleData,
        message: "Lab sample data retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get lab sample data",
      });
    }
  }

  // Get all lab samples (optionally filtered by patient)
  async getLabSamples(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.query;

      const samples = await reportHandlerService.getLabSamples(
        patientId as string
      );

      res.status(200).json({
        success: true,
        data: samples,
        message: "Lab samples retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get lab samples",
      });
    }
  }

  // Update lab sample status
  async updateLabSample(req: Request, res: Response): Promise<void> {
    try {
      const { labSampleId } = req.params;
      const { status, priority, notes } = req.body;

      const updatedSample = await reportHandlerService.updateLabSample(
        parseInt(labSampleId),
        {
          status,
          priority,
          notes,
        }
      );

      res.status(200).json({
        success: true,
        data: updatedSample,
        message: "Lab sample updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update lab sample",
      });
    }
  }
}
