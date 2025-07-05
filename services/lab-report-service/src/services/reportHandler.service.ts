import { Repository } from "typeorm";
import { TestTypes } from "../entity/testTypes";
import { AppDataSource } from "../data-source";

export class ReportHandlerService {
  testTypesRepository: Repository<TestTypes>;

  constructor() {
    this.testTypesRepository = AppDataSource.getRepository(TestTypes);
  }

  async getTestTypes(): Promise<TestTypes[]> {
    try {
      return await this.testTypesRepository.find();
    } catch (error) {
      console.error("Error fetching test types:", error);
      throw new Error("Failed to fetch test types");
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
}

export const reportHandlerService = new ReportHandlerService();
