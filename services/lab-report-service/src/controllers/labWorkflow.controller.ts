import { Request, Response } from "express";
import { labWorkflowService } from "../services/labWorkflow.service";
import { reportHandlerService } from "../services/reportHandler.service";
import { EditLabResultDto } from "../dto/labResult.dto";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

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

  // Get lab samples by lab ID (from token)
  async getLabSamplesByLabId(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user is authenticated
      console.log("User:", req.user);

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required. No user data found in token.",
        });
        return;
      }

      // Use labId from token, fallback to hospitalId if labId is not present
      const labId = req.user.labId || req.user.hospitalId;

      if (!labId) {
        res.status(401).json({
          success: false,
          message: "Lab ID or Hospital ID not found in token. Access denied.",
          debug: {
            userId: req.user.id,
            role: req.user.role,
            labId: req.user.labId,
            hospitalId: req.user.hospitalId,
          },
        });
        return;
      }

      const { status, priority, fromDate, toDate } = req.query;

      const filters = {
        status: status as string,
        priority: priority as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      };

      // Remove undefined values from filters
      Object.keys(filters).forEach(
        (key) =>
          filters[key as keyof typeof filters] === undefined &&
          delete filters[key as keyof typeof filters]
      );

      const samples = await labWorkflowService.getLabSamplesByLabId(
        labId,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        success: true,
        data: samples,
        labId: labId,
        hospitalId: req.user.hospitalId,
        count: samples.length,
        filters: Object.keys(filters).length > 0 ? filters : null,
        message: "Lab samples retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get lab samples by lab ID",
      });
    }
  }

  // Get lab samples by specific lab ID (with authorization check)
  async getLabSamplesBySpecificLabId(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { labId } = req.params;
      const { status, priority, fromDate, toDate } = req.query;

      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Get user's lab/hospital ID
      const userLabId = req.user.labId || req.user.hospitalId;

      // Check if user has access to this lab (either their own lab or admin role)
      if (
        userLabId !== labId &&
        req.user.role !== "admin" &&
        req.user.role !== "ADMIN"
      ) {
        res.status(403).json({
          success: false,
          message:
            "Access denied. You can only access samples from your own lab.",
          debug: {
            requestedLabId: labId,
            userLabId: userLabId,
            userRole: req.user.role,
          },
        });
        return;
      }

      const filters = {
        status: status as string,
        priority: priority as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      };

      // Remove undefined values from filters
      Object.keys(filters).forEach(
        (key) =>
          filters[key as keyof typeof filters] === undefined &&
          delete filters[key as keyof typeof filters]
      );

      const samples = await labWorkflowService.getLabSamplesByLabId(
        labId,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        success: true,
        data: samples,
        labId: labId,
        userLabId: userLabId,
        count: samples.length,
        filters: Object.keys(filters).length > 0 ? filters : null,
        message: "Lab samples retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get lab samples by lab ID",
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

  // Get lab result by ID (with authorization)
  async getLabResult(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { resultId } = req.params;

      if (!resultId || isNaN(parseInt(resultId))) {
        res.status(400).json({
          success: false,
          message: "Invalid result ID provided",
        });
        return;
      }

      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Get user's lab/hospital ID
      const userLabId = req.user.labId || req.user.hospitalId;

      // Admin users can access any lab result, regular users need lab authorization
      const isAdmin = req.user.role === "admin" || req.user.role === "ADMIN";

      const labResult = await labWorkflowService.getLabResultById(
        parseInt(resultId),
        isAdmin ? undefined : userLabId // Skip lab authorization for admin users
      );

      res.status(200).json({
        success: true,
        data: labResult,
        userLabId: userLabId,
        isAdmin: isAdmin,
        message: "Lab result retrieved successfully",
      });
    } catch (error) {
      console.error("Error in getLabResult:", error);

      // Check if it's an authorization error
      if (error instanceof Error && error.message.includes("Access denied")) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Check if it's a not found error
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve lab result",
      });
    }
  }

  // Edit lab result data (for manual corrections)
  async editLabResult(req: Request, res: Response): Promise<void> {
    try {
      const { resultId } = req.params;
      const editData: EditLabResultDto = req.body;

      if (!resultId || isNaN(parseInt(resultId))) {
        res.status(400).json({
          success: false,
          message: "Invalid result ID provided",
        });
        return;
      }

      if (!editData.extractedData) {
        res.status(400).json({
          success: false,
          message: "Extracted data is required for editing",
        });
        return;
      }

      const updatedResult = await reportHandlerService.editLabResult(
        parseInt(resultId),
        editData
      );

      res.status(200).json({
        success: true,
        data: updatedResult,
        message: "Lab result updated successfully",
      });
    } catch (error) {
      console.error("Error in editLabResult:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to edit lab result",
      });
    }
  }

  // Debug endpoint to check token payload
  async debugTokenInfo(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "No user data found in token",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Token payload information",
        data: {
          user: req.user,
          effectiveLabId: req.user.labId || req.user.hospitalId,
          hasLabId: !!req.user.labId,
          hasHospitalId: !!req.user.hospitalId,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve token information",
      });
    }
  }

  // Get all lab results (admin access)
  async getAllLabResults(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user is authenticated and has admin role
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (req.user.role !== "admin" && req.user.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          message: "Admin access required to view all lab results",
        });
        return;
      }

      const { status, fromDate, toDate } = req.query;

      const filters = {
        status: status as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      };

      // Remove undefined values from filters
      Object.keys(filters).forEach(
        (key) =>
          filters[key as keyof typeof filters] === undefined &&
          delete filters[key as keyof typeof filters]
      );

      const labResults = await labWorkflowService.getAllLabResults(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        success: true,
        data: labResults,
        count: labResults.length,
        filters: Object.keys(filters).length > 0 ? filters : null,
        message: "Lab results retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get lab results",
      });
    }
  }

  // Get lab results by lab ID (from token)
  async getLabResultsByLabId(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Use labId from token, fallback to hospitalId if labId is not present
      const labId = req.user.labId || req.user.hospitalId;

      if (!labId) {
        res.status(401).json({
          success: false,
          message: "Lab ID or Hospital ID not found in token. Access denied.",
          debug: {
            userId: req.user.id,
            role: req.user.role,
            labId: req.user.labId,
            hospitalId: req.user.hospitalId,
          },
        });
        return;
      }

      const { status, fromDate, toDate } = req.query;

      const filters = {
        status: status as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      };

      // Remove undefined values from filters
      Object.keys(filters).forEach(
        (key) =>
          filters[key as keyof typeof filters] === undefined &&
          delete filters[key as keyof typeof filters]
      );

      const labResults = await labWorkflowService.getLabResultsByLabId(
        labId,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        success: true,
        data: labResults,
        labId: labId,
        hospitalId: req.user.hospitalId,
        count: labResults.length,
        filters: Object.keys(filters).length > 0 ? filters : null,
        message: "Lab results retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get lab results by lab ID",
      });
    }
  }

  // Get lab results for a specific lab ID (with authorization check)
  async getLabResultsBySpecificLabId(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { labId } = req.params;
      const { status, fromDate, toDate } = req.query;

      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Get user's lab/hospital ID
      const userLabId = req.user.labId || req.user.hospitalId;

      // Check if user has access to this lab (either their own lab or admin role)
      if (
        userLabId !== labId &&
        req.user.role !== "admin" &&
        req.user.role !== "ADMIN"
      ) {
        res.status(403).json({
          success: false,
          message:
            "Access denied. You can only access results from your own lab.",
          debug: {
            requestedLabId: labId,
            userLabId: userLabId,
            userRole: req.user.role,
          },
        });
        return;
      }

      const filters = {
        status: status as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      };

      // Remove undefined values from filters
      Object.keys(filters).forEach(
        (key) =>
          filters[key as keyof typeof filters] === undefined &&
          delete filters[key as keyof typeof filters]
      );

      const labResults = await labWorkflowService.getLabResultsByLabId(
        labId,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        success: true,
        data: labResults,
        labId: labId,
        userLabId: userLabId,
        count: labResults.length,
        filters: Object.keys(filters).length > 0 ? filters : null,
        message: "Lab results retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get lab results by lab ID",
      });
    }
  }
}
