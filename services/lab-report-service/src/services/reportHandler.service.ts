import { Repository } from "typeorm";
import { TestTypes } from "../entity/testType.entity";
import { LabSample } from "../entity/labSample.entity";
import { LabResult } from "../entity/labResult.entity";
import { AppDataSource } from "../data-source";
import { CreateLabSampleDto, UpdateLabSampleDto } from "../dto/labSample.dto";
import { CreateLabResultDto } from "../dto/labResult.dto";
import {
  CreateTestTypeDto,
  UpdateTestTypeDto,
  ReportTemplateDto,
  AvailableParserDto,
} from "../dto/testType.dto";
import { spawn } from "child_process";
import * as path from "path";

export class ReportHandlerService {
  testTypesRepository: Repository<TestTypes>;
  labSampleRepository: Repository<LabSample>;
  labResultRepository: Repository<LabResult>;

  constructor() {
    this.testTypesRepository = AppDataSource.getRepository(TestTypes);
    this.labSampleRepository = AppDataSource.getRepository(LabSample);
    this.labResultRepository = AppDataSource.getRepository(LabResult);
  }

  // Enhanced TestTypes methods with template support
  async getTestTypes(): Promise<TestTypes[]> {
    try {
      return await this.testTypesRepository.find();
    } catch (error) {
      console.error("Error fetching test types:", error);
      throw new Error("Failed to fetch test types");
    }
  }

  async getTestTypeById(id: number): Promise<TestTypes | null> {
    try {
      return await this.testTypesRepository.findOne({ where: { id } });
    } catch (error) {
      console.error("Error fetching test type:", error);
      throw new Error("Failed to fetch test type");
    }
  }

  async addTestType(testTypeData: CreateTestTypeDto): Promise<TestTypes> {
    try {
      const testType = this.testTypesRepository.create(testTypeData);

      // Set complex fields using setters
      if (testTypeData.reportFields) {
        testType.reportFields = testTypeData.reportFields;
      }
      if (testTypeData.referenceRanges) {
        testType.referenceRanges = testTypeData.referenceRanges;
      }
      if (testTypeData.basicFields) {
        testType.basicFields = testTypeData.basicFields;
      }

      return await this.testTypesRepository.save(testType);
    } catch (error) {
      console.error("Error adding test type:", error);
      throw new Error("Failed to add test type");
    }
  }

  async updateTestType(
    id: number,
    updateData: UpdateTestTypeDto
  ): Promise<TestTypes> {
    try {
      const testType = await this.getTestTypeById(id);
      if (!testType) {
        throw new Error("Test type not found");
      }

      // Update basic fields
      Object.assign(testType, updateData);

      // Update complex fields using setters
      if (updateData.reportFields) {
        testType.reportFields = updateData.reportFields;
      }
      if (updateData.referenceRanges) {
        testType.referenceRanges = updateData.referenceRanges;
      }
      if (updateData.basicFields) {
        testType.basicFields = updateData.basicFields;
      }

      return await this.testTypesRepository.save(testType);
    } catch (error) {
      console.error("Error updating test type:", error);
      throw new Error("Failed to update test type");
    }
  }

  async createReportTemplate(
    templateData: ReportTemplateDto
  ): Promise<TestTypes> {
    try {
      const testType = await this.getTestTypeById(templateData.testTypeId);
      if (!testType) {
        throw new Error("Test type not found");
      }

      // Update the test type with the new template
      testType.reportFields = templateData.reportFields;
      testType.referenceRanges = templateData.referenceRanges;

      return await this.testTypesRepository.save(testType);
    } catch (error) {
      console.error("Error creating report template:", error);
      throw new Error("Failed to create report template");
    }
  }

  async getAvailableParsers(): Promise<AvailableParserDto[]> {
    try {
      // Get available parsers from Python parser factory
      const pythonScript = path.join(
        __dirname,
        "../../python/get_available_parsers.py"
      );

      return new Promise((resolve, reject) => {
        const pythonProcess = spawn("python", [pythonScript]);
        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const parsers = JSON.parse(output);
              resolve(parsers);
            } catch (parseError) {
              reject(new Error("Failed to parse available parsers"));
            }
          } else {
            console.error("Python script error:", errorOutput);
            reject(new Error("Failed to get available parsers"));
          }
        });
      });
    } catch (error) {
      console.error("Error getting available parsers:", error);
      throw new Error("Failed to get available parsers");
    }
  }

  // LabSample methods (enhanced to pass test type ID to extraction)
  async createLabSample(labSampleData: CreateLabSampleDto): Promise<LabSample> {
    try {
      // Validate test type exists
      const testType = await this.testTypesRepository.findOne({
        where: { id: labSampleData.testTypeId },
      });

      if (!testType) {
        throw new Error("Test type not found");
      }

      const labSample = this.labSampleRepository.create({
        ...labSampleData,
        status: "pending",
      });

      return await this.labSampleRepository.save(labSample);
    } catch (error) {
      console.error("Error creating lab sample:", error);
      throw new Error("Failed to create lab sample");
    }
  }

  async getLabSamples(patientId?: string): Promise<LabSample[]> {
    try {
      const query = this.labSampleRepository
        .createQueryBuilder("labSample")
        .leftJoinAndSelect("labSample.testType", "testType")
        .leftJoinAndSelect("labSample.labResults", "labResults");

      if (patientId) {
        query.where("labSample.patientId = :patientId", { patientId });
      }

      return await query.getMany();
    } catch (error) {
      console.error("Error fetching lab samples:", error);
      throw new Error("Failed to fetch lab samples");
    }
  }

  async getLabSampleById(id: number): Promise<LabSample | null> {
    try {
      return await this.labSampleRepository.findOne({
        where: { id },
        relations: ["testType", "labResults"],
      });
    } catch (error) {
      console.error("Error fetching lab sample:", error);
      throw new Error("Failed to fetch lab sample");
    }
  }

  async updateLabSample(
    id: number,
    updateData: UpdateLabSampleDto
  ): Promise<LabSample> {
    try {
      await this.labSampleRepository.update(id, updateData);
      const updated = await this.getLabSampleById(id);
      if (!updated) {
        throw new Error("Lab sample not found after update");
      }
      return updated;
    } catch (error) {
      console.error("Error updating lab sample:", error);
      throw new Error("Failed to update lab sample");
    }
  }

  // Enhanced LabResult methods with dynamic extraction
  async createLabResult(labResultData: CreateLabResultDto): Promise<LabResult> {
    try {
      // Validate lab sample exists and get test type information
      const labSample = await this.labSampleRepository.findOne({
        where: { id: labResultData.labSampleId },
        relations: ["testType"],
      });

      if (!labSample) {
        throw new Error("Lab sample not found");
      }

      // Create lab result instance
      const labResult = this.labResultRepository.create({
        labSampleId: labResultData.labSampleId,
        reportUrl: labResultData.reportUrl,
      });

      // Set extracted data (will be encrypted automatically by entity hooks)
      labResult.setExtractedData(labResultData.extractedData);

      const savedResult = await this.labResultRepository.save(labResult);

      console.log("🔒 Lab result saved with encrypted data");

      // Update lab sample status to completed
      await this.labSampleRepository.update(labResultData.labSampleId, {
        status: "completed",
      });

      return savedResult;
    } catch (error) {
      console.error("Error creating lab result:", error);
      throw new Error("Failed to create lab result");
    }
  }

  async getLabResultsByPatient(patientId: string): Promise<LabResult[]> {
    try {
      return await this.labResultRepository
        .createQueryBuilder("labResult")
        .leftJoinAndSelect("labResult.labSample", "labSample")
        .leftJoinAndSelect("labSample.testType", "testType")
        .where("labSample.patientId = :patientId", { patientId })
        .getMany();
    } catch (error) {
      console.error("Error fetching lab results:", error);
      throw new Error("Failed to fetch lab results");
    }
  }

  async getLabResultById(id: number): Promise<LabResult | null> {
    try {
      return await this.labResultRepository.findOne({
        where: { id },
        relations: ["labSample", "labSample.testType"],
      });
    } catch (error) {
      console.error("Error fetching lab result:", error);
      throw new Error("Failed to fetch lab result");
    }
  }
}

export const reportHandlerService = new ReportHandlerService();
