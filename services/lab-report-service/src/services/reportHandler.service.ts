import { Repository } from "typeorm";
import { TestTypes } from "../entity/testType.entity";
import { LabSample } from "../entity/labSample.entity";
import { LabResult } from "../entity/labResult.entity";
import { AppDataSource } from "../data-source";
import { CreateLabSampleDto, UpdateLabSampleDto } from "../dto/labSample.dto";
import { CreateLabResultDto, EditLabResultDto } from "../dto/labResult.dto";
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

  async deleteTestType(id: number): Promise<boolean> {
    try {
      // Check if test type exists
      const testType = await this.getTestTypeById(id);
      if (!testType) {
        return false;
      }

      // Check if there are any lab samples using this test type
      const samplesCount = await this.labSampleRepository.count({
        where: { testTypeId: id },
      });

      if (samplesCount > 0) {
        throw new Error(
          `Cannot delete test type. It is being used by ${samplesCount} lab sample(s).`
        );
      }

      // Delete the test type
      const result = await this.testTypesRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting test type:", error);
      throw error;
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

  async getLabSamplesByLabId(
    labId: string,
    filters?: {
      status?: string;
      priority?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<LabSample[]> {
    try {
      const query = this.labSampleRepository
        .createQueryBuilder("labSample")
        .leftJoinAndSelect("labSample.testType", "testType")
        .leftJoinAndSelect("labSample.labResults", "labResults")
        .where("labSample.labId = :labId", { labId });

      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query.andWhere("labSample.status = :status", {
            status: filters.status,
          });
        }
        if (filters.priority) {
          query.andWhere("labSample.priority = :priority", {
            priority: filters.priority,
          });
        }
        if (filters.fromDate) {
          query.andWhere("labSample.createdAt >= :fromDate", {
            fromDate: filters.fromDate,
          });
        }
        if (filters.toDate) {
          query.andWhere("labSample.createdAt <= :toDate", {
            toDate: filters.toDate,
          });
        }
      }

      return await query.orderBy("labSample.createdAt", "DESC").getMany();
    } catch (error) {
      console.error("Error fetching lab samples by labId:", error);
      throw new Error("Failed to fetch lab samples by labId");
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

      // Refetch the entity to ensure proper decryption of the saved data
      const finalResult = await this.getLabResultById(savedResult.id);
      return finalResult || savedResult;
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

  async editLabResult(
    id: number,
    editData: EditLabResultDto
  ): Promise<LabResult> {
    try {
      // Check if lab result exists
      const labResult = await this.getLabResultById(id);
      if (!labResult) {
        throw new Error("Lab result not found");
      }

      // Update the extracted data (will be re-encrypted automatically)
      labResult.setExtractedData(editData.extractedData);

      // Update status to indicate manual editing
      labResult.status = "manually_edited";

      // Add edit metadata to the extracted data
      const updatedData = {
        ...editData.extractedData,
        _editMetadata: {
          editedAt: new Date().toISOString(),
          editedBy: editData.editedBy || "lab_operator",
          notes: editData.notes || "Manual correction by lab operator",
          originalEditTimestamp: Date.now(),
        },
      };

      labResult.setExtractedData(updatedData);

      await this.labResultRepository.save(labResult);

      console.log("🔒 Lab result updated with manually edited encrypted data");

      // Refetch the entity to ensure proper decryption of the saved data
      const updatedResult = await this.getLabResultById(id);
      if (!updatedResult) {
        throw new Error("Failed to retrieve updated lab result");
      }

      return updatedResult;
    } catch (error) {
      console.error("Error editing lab result:", error);
      throw new Error("Failed to edit lab result");
    }
  }

  // Get all lab results with optional filtering
  async getAllLabResults(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<LabResult[]> {
    try {
      const query = this.labResultRepository
        .createQueryBuilder("labResult")
        .leftJoinAndSelect("labResult.labSample", "labSample")
        .leftJoinAndSelect("labSample.testType", "testType");

      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query.andWhere("labResult.status = :status", {
            status: filters.status,
          });
        }
        if (filters.fromDate) {
          query.andWhere("labResult.createdAt >= :fromDate", {
            fromDate: filters.fromDate,
          });
        }
        if (filters.toDate) {
          query.andWhere("labResult.createdAt <= :toDate", {
            toDate: filters.toDate,
          });
        }
      }

      return await query.orderBy("labResult.createdAt", "DESC").getMany();
    } catch (error) {
      console.error("Error fetching all lab results:", error);
      throw new Error("Failed to fetch all lab results");
    }
  }

  // Get lab results for a specific lab using labId
  async getLabResultsByLabId(
    labId: string,
    filters?: {
      status?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<LabResult[]> {
    try {
      const query = this.labResultRepository
        .createQueryBuilder("labResult")
        .leftJoinAndSelect("labResult.labSample", "labSample")
        .leftJoinAndSelect("labSample.testType", "testType")
        .where("labSample.labId = :labId", { labId });

      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query.andWhere("labResult.status = :status", {
            status: filters.status,
          });
        }
        if (filters.fromDate) {
          query.andWhere("labResult.createdAt >= :fromDate", {
            fromDate: filters.fromDate,
          });
        }
        if (filters.toDate) {
          query.andWhere("labResult.createdAt <= :toDate", {
            toDate: filters.toDate,
          });
        }
      }

      return await query.orderBy("labResult.createdAt", "DESC").getMany();
    } catch (error) {
      console.error("Error fetching lab results by labId:", error);
      throw new Error("Failed to fetch lab results by labId");
    }
  }
}

export const reportHandlerService = new ReportHandlerService();
