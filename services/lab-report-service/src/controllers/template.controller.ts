import { Request, Response } from "express";
import { reportHandlerService } from "../services/reportHandler.service";
import {
  CreateTestTypeDto,
  UpdateTestTypeDto,
  ReportTemplateDto,
} from "../dto/testType.dto";

interface TemplateRequest extends Request {
  body: any;
  params: {
    id?: string;
    testTypeId?: string;
  };
}

class TemplateController {
  // Test Type Management
  async createTestType(req: TemplateRequest, res: Response): Promise<void> {
    try {
      const testTypeData: CreateTestTypeDto = req.body;

      const testType = await reportHandlerService.addTestType(testTypeData);

      res.status(201).json({
        success: true,
        data: testType,
        message: "Test type created successfully",
      });
    } catch (error: any) {
      console.error("Error creating test type:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create test type",
      });
    }
  }

  async updateTestType(req: TemplateRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id!);
      const updateData: UpdateTestTypeDto = req.body;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid test type ID",
        });
        return;
      }

      const testType = await reportHandlerService.updateTestType(
        id,
        updateData
      );

      res.status(200).json({
        success: true,
        data: testType,
        message: "Test type updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating test type:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update test type",
      });
    }
  }

  async getTestTypes(req: TemplateRequest, res: Response): Promise<void> {
    try {
      const testTypes = await reportHandlerService.getTestTypes();

      res.status(200).json({
        success: true,
        data: testTypes,
      });
    } catch (error: any) {
      console.error("Error fetching test types:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch test types",
      });
    }
  }

  async getTestTypeById(req: TemplateRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id!);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid test type ID",
        });
        return;
      }

      const testType = await reportHandlerService.getTestTypeById(id);

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
      });
    } catch (error: any) {
      console.error("Error fetching test type:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch test type",
      });
    }
  }

  async deleteTestType(req: TemplateRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id!);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid test type ID",
        });
        return;
      }

      const deleted = await reportHandlerService.deleteTestType(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Test type not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Test type deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting test type:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete test type",
      });
    }
  }

  // Template Management
  async createReportTemplate(
    req: TemplateRequest,
    res: Response
  ): Promise<void> {
    try {
      const templateData: ReportTemplateDto = req.body;

      const testType = await reportHandlerService.createReportTemplate(
        templateData
      );

      res.status(201).json({
        success: true,
        data: testType,
        message: "Report template created successfully",
      });
    } catch (error: any) {
      console.error("Error creating report template:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create report template",
      });
    }
  }

  async getReportTemplate(req: TemplateRequest, res: Response): Promise<void> {
    try {
      const testTypeId = parseInt(req.params.testTypeId!);

      if (isNaN(testTypeId)) {
        res.status(400).json({
          success: false,
          message: "Invalid test type ID",
        });
        return;
      }

      const testType = await reportHandlerService.getTestTypeById(testTypeId);

      if (!testType) {
        res.status(404).json({
          success: false,
          message: "Test type not found",
        });
        return;
      }

      const template = {
        testTypeId: testType.id,
        testType: {
          value: testType.value,
          label: testType.label,
          category: testType.category,
          parserClass: testType.parserClass,
          parserModule: testType.parserModule,
        },
        reportFields: testType.reportFields,
        referenceRanges: testType.referenceRanges,
        basicFields: testType.basicFields,
      };

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      console.error("Error fetching report template:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch report template",
      });
    }
  }

  // Parser Management
  async getAvailableParsers(
    req: TemplateRequest,
    res: Response
  ): Promise<void> {
    try {
      const parsers = await reportHandlerService.getAvailableParsers();

      res.status(200).json({
        success: true,
        data: parsers,
      });
    } catch (error: any) {
      console.error("Error fetching available parsers:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch available parsers",
      });
    }
  }

  // Field Types for Template Creation
  async getFieldTypes(req: TemplateRequest, res: Response): Promise<void> {
    try {
      const fieldTypes = [
        { value: "text", label: "Text" },
        { value: "number", label: "Number" },
        { value: "decimal", label: "Decimal" },
        { value: "date", label: "Date" },
        { value: "boolean", label: "Boolean" },
      ];

      res.status(200).json({
        success: true,
        data: fieldTypes,
      });
    } catch (error: any) {
      console.error("Error fetching field types:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch field types",
      });
    }
  }

  // Categories for Test Types
  async getCategories(req: TemplateRequest, res: Response): Promise<void> {
    try {
      const categories = [
        { value: "hematology", label: "Hematology" },
        { value: "biochemistry", label: "Biochemistry" },
        { value: "microbiology", label: "Microbiology" },
        { value: "immunology", label: "Immunology" },
        { value: "pathology", label: "Pathology" },
        { value: "general", label: "General" },
      ];

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch categories",
      });
    }
  }
}

export default new TemplateController();
