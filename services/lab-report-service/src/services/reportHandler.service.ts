import { Repository } from "typeorm";
import { TestTypes } from "../entity/testType.entity";
import { LabSample } from "../entity/labSample.entity";
import { LabResult } from "../entity/labResult.entity";
import { AppDataSource } from "../data-source";
import { CreateLabSampleDto, UpdateLabSampleDto } from "../dto/labSample.dto";
import { CreateLabResultDto } from "../dto/labResult.dto";

export class ReportHandlerService {
  testTypesRepository: Repository<TestTypes>;
  labSampleRepository: Repository<LabSample>;
  labResultRepository: Repository<LabResult>;

  constructor() {
    this.testTypesRepository = AppDataSource.getRepository(TestTypes);
    this.labSampleRepository = AppDataSource.getRepository(LabSample);
    this.labResultRepository = AppDataSource.getRepository(LabResult);
  }

  // TestTypes methods
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

  async addTestType(testType: TestTypes): Promise<TestTypes> {
    try {
      return await this.testTypesRepository.save(testType);
    } catch (error) {
      console.error("Error adding test type:", error);
      throw new Error("Failed to add test type");
    }
  }

  // LabSample methods
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

  // LabResult methods
  async createLabResult(labResultData: CreateLabResultDto): Promise<LabResult> {
    try {
      // Validate lab sample exists
      const labSample = await this.labSampleRepository.findOne({
        where: { id: labResultData.labSampleId },
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
