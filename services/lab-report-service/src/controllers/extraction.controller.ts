import { Request, Response } from "express";
import pythonService from "../services/python.service";

interface ExtractRequest extends Request {
  file?: Express.Multer.File;
  body: {
    filePath?: string;
    fileFormat: string;
    testTypeId?: number;
  };
}

interface ExtractResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

class ExtractionController {
  async extractData(
    req: ExtractRequest,
    res: Response<ExtractResponse>
  ): Promise<void> {
    try {
      // Handle file upload case
      const filePath = req.file ? req.file.path : req.body.filePath;
      const fileFormat = req.body.fileFormat;
      const testTypeId = req.body.testTypeId;

      if (!filePath || !fileFormat) {
        res.status(400).json({
          success: false,
          message: "File path and file format are required",
        });
        return;
      }

      console.log(`🔬 Extracting data with dynamic parser:`);
      console.log(`   File: ${filePath}`);
      console.log(`   Format: ${fileFormat}`);
      console.log(`   Test Type ID: ${testTypeId || "Not specified"}`);

      // Call the Python service to perform extraction with optional test type ID
      const extractedData = await pythonService.extractData(
        filePath,
        fileFormat,
        testTypeId
      );

      res.status(200).json({
        success: true,
        data: extractedData,
      });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during extraction.",
        error: error.message,
      });
    }
  }
}

export default new ExtractionController();
