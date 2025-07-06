import { reportHandlerService } from "./reportHandler.service";
import pythonService from "./python.service";
import { CreateLabSampleDto } from "../dto/labSample.dto";
import { LabSample } from "../entity/labSample.entity";
import { LabResult } from "../entity/labResult.entity";

export class LabWorkflowService {
  /**
   * Step 1: Create a lab sample for a patient
   */
  async createLabSample(labSampleData: CreateLabSampleDto): Promise<LabSample> {
    try {
      const labSample = await reportHandlerService.createLabSample(
        labSampleData
      );
      console.log(
        ` Lab sample created with ID: ${labSample.id} for patient: ${labSample.patientId}`
      );
      return labSample;
    } catch (error) {
      console.error(" Failed to create lab sample:", error);
      throw error;
    }
  }

  /**
   * Step 2: Process lab report and extract data
   */
  async processLabReport(
    labSampleId: number,
    reportFilePath: string
  ): Promise<LabResult> {
    try {
      // Get the lab sample
      const labSample = await reportHandlerService.getLabSampleById(
        labSampleId
      );
      if (!labSample) {
        throw new Error("Lab sample not found");
      }

      // Update lab sample status to in-progress
      await reportHandlerService.updateLabSample(labSampleId, {
        status: "in-progress",
      });

      // Extract data using Python service
      const extractedData = await pythonService.extractData(
        reportFilePath,
        labSample.testType.value
      );

      console.log(` Data extracted successfully for lab sample ${labSampleId}`);

      // Create lab result with extracted data
      const labResult = await reportHandlerService.createLabResult({
        labSampleId: labSampleId,
        reportUrl: reportFilePath,
        extractedData: extractedData,
      });

      console.log(` Lab result created with ID: ${labResult.id}`);
      return labResult;
    } catch (error) {
      console.error(" Failed to process lab report:", error);

      // Update lab sample status to failed
      await reportHandlerService.updateLabSample(labSampleId, {
        status: "failed",
      });

      throw error;
    }
  }

  /**
   * Get complete lab workflow status for a patient
   */
  async getPatientLabHistory(patientId: string) {
    try {
      const labSamples = await reportHandlerService.getLabSamples(patientId);
      const labResults = await reportHandlerService.getLabResultsByPatient(
        patientId
      );

      return {
        patient: patientId,
        totalSamples: labSamples.length,
        completedTests: labResults.length,
        pendingTests: labSamples.filter((sample) => sample.status === "pending")
          .length,
        inProgressTests: labSamples.filter(
          (sample) => sample.status === "in-progress"
        ).length,
        failedTests: labSamples.filter((sample) => sample.status === "failed")
          .length,
        samples: labSamples,
        results: labResults,
      };
    } catch (error) {
      console.error(" Failed to get patient lab history:", error);
      throw error;
    }
  }

  /**
   * Get lab sample with its results
   */
  async getLabSampleWithResults(labSampleId: number) {
    try {
      const labSample = await reportHandlerService.getLabSampleById(
        labSampleId
      );
      if (!labSample) {
        throw new Error("Lab sample not found");
      }

      return {
        sample: labSample,
        hasResults: labSample.labResults && labSample.labResults.length > 0,
        resultCount: labSample.labResults?.length || 0,
        status: labSample.status,
      };
    } catch (error) {
      console.error(" Failed to get lab sample with results:", error);
      throw error;
    }
  }
}

export const labWorkflowService = new LabWorkflowService();
