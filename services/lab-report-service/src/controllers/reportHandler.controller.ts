import { Request, Response } from "express";
import { ReportHandlerService } from "../services/reportHandler.service";

export class ReportHandlerController {
  constructor(private reportHandlerService: ReportHandlerService) {}

  async addTestType(req: Request, res: Response): Promise<void> {
    try {
      const testType = await this.reportHandlerService.addTestType(req.body);
      res.status(201).json({
        success: true,
        data: testType,
        message: "Test type added successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getTestTypes(req: Request, res: Response): Promise<void> {
    try {
      const testTypes = await this.reportHandlerService.getTestTypes();
      res.status(200).json({
        success: true,
        data: testTypes,
        message: "Test types retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getTestTypeById(req: Request, res: Response): Promise<void> {
    try {
      const testType = await this.reportHandlerService.getTestTypeById(
        parseInt(req.params.id)
      );
      if (!testType) {
        res.status(404).json({
          success: false,
          message: "Test type not found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: testType,
        message: "Test type retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
