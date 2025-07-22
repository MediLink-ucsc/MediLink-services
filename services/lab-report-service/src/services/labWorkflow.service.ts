import { reportHandlerService } from "./reportHandler.service";
import pythonService from "./python.service";
import { CreateLabSampleDto } from "../dto/labSample.dto";
import { LabSample } from "../entity/labSample.entity";
import { LabResult } from "../entity/labResult.entity";
import { publishLabSampleCreated } from "../events/producers/labSampleCreated.producer";

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

      await publishLabSampleCreated({
        key: labSample.id.toString(),
        value: labSample,
      });

      return labSample;
    } catch (error) {
      console.error(" Failed to create lab sample:", error);
      throw error;
    }
  }

  /**
   * Step 2: Process lab report and extract data (Async)
   */
  async processLabReport(
    labSampleId: number,
    reportFilePath: string
  ): Promise<{ message: string; labSampleId: number; status: string }> {
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

      // Start extraction process in background (don't await)
      this.processExtractionInBackground(
        labSampleId,
        reportFilePath,
        labSample.testType.value
      );

      console.log(` Lab report processing started for sample ${labSampleId}`);

      // Return immediate response
      return {
        message: "Lab report extraction started successfully",
        labSampleId: labSampleId,
        status: "in-progress",
      };
    } catch (error) {
      console.error(" Failed to start lab report processing:", error);

      // Update lab sample status to failed
      await reportHandlerService.updateLabSample(labSampleId, {
        status: "failed",
      });

      throw error;
    }
  }

  /**
   * Background process for data extraction
   */
  private async processExtractionInBackground(
    labSampleId: number,
    reportFilePath: string,
    testType: string
  ): Promise<void> {
    try {
      console.log(
        ` Starting background extraction for lab sample ${labSampleId}`
      );

      // Extract data using Python service
      const extractedData = await pythonService.extractData(
        reportFilePath,
        testType
      );

      console.log(` Data extracted successfully for lab sample ${labSampleId}`);

      // Create lab result with extracted data (will be encrypted automatically)
      const labResult = await reportHandlerService.createLabResult({
        labSampleId: labSampleId,
        reportUrl: reportFilePath,
        extractedData: extractedData,
      });

      // Update lab sample status to completed
      await reportHandlerService.updateLabSample(labSampleId, {
        status: "completed",
      });

      console.log(
        ` Lab result created with ID: ${labResult.id}, sample ${labSampleId} completed (data encrypted)`
      );

      // TODO: Optionally publish event or send notification when processing is complete
      // await publishLabResultCreated({ key: labResult.id.toString(), value: labResult });
    } catch (error) {
      console.error(
        ` Background extraction failed for lab sample ${labSampleId}:`,
        error
      );

      // Update lab sample status to failed
      await reportHandlerService.updateLabSample(labSampleId, {
        status: "failed",
      });

      // TODO: Optionally publish error event or send notification
    }
  }

  /**
   * Check processing status of a lab sample
   */
  async getLabSampleProcessingStatus(labSampleId: number) {
    try {
      const labSample = await reportHandlerService.getLabSampleById(
        labSampleId
      );
      if (!labSample) {
        throw new Error("Lab sample not found");
      }

      const hasResults =
        labSample.labResults && labSample.labResults.length > 0;

      return {
        labSampleId: labSampleId,
        status: labSample.status,
        isComplete: labSample.status === "completed",
        isFailed: labSample.status === "failed",
        isProcessing: labSample.status === "in-progress",
        isPending: labSample.status === "pending",
        hasResults: hasResults,
        resultCount: labSample.labResults?.length || 0,
        message: this.getStatusMessage(labSample.status, hasResults),
      };
    } catch (error) {
      console.error(" Failed to get lab sample processing status:", error);
      throw error;
    }
  }

  /**
   * Helper method to get user-friendly status message
   */
  private getStatusMessage(status: string, hasResults: boolean): string {
    switch (status) {
      case "pending":
        return "Lab sample is waiting to be processed";
      case "in-progress":
        return "Lab report extraction is currently in progress";
      case "completed":
        return hasResults
          ? "Lab report processing completed successfully"
          : "Processing completed but no results found";
      case "failed":
        return "Lab report processing failed. Please try again or contact support";
      default:
        return "Unknown status";
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
