import { ACTIVITY_TOPICS, ACTIVITY_TYPES } from "../constants";
import { ActivityEvent, KafkaEventData } from "../types";
import { ActivityService } from "../services/ActivityService";
import logger from "../config/logger";

export class EventProcessor {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  async processEvent(eventData: KafkaEventData): Promise<void> {
    try {
      const { topic, value, timestamp } = eventData;

      logger.info(`Processing event from topic: ${topic}`, { value });

      const activityEvents = this.mapKafkaEventToActivity(
        topic,
        value,
        timestamp
      );

      if (activityEvents && activityEvents.length > 0) {
        for (const activityEvent of activityEvents) {
          await this.activityService.createActivity(activityEvent);
          logger.info(`Activity created for topic: ${topic}`, {
            entityType: activityEvent.entityType,
            entityId: activityEvent.entityId,
          });
        }
      } else {
        logger.warn(`Unknown topic or unable to process: ${topic}`);
      }
    } catch (error) {
      logger.error("Failed to process event:", error);
      throw error;
    }
  }

  private mapKafkaEventToActivity(
    topic: string,
    value: any,
    timestamp: string
  ): Omit<ActivityEvent, "id">[] | null {
    // Handle timestamp - prefer timestamp from message value, fallback to Kafka message timestamp, then current time
    let eventTimestamp: Date;

    if (value.timestamp) {
      eventTimestamp = new Date(value.timestamp);
    } else if (timestamp) {
      // Kafka timestamp might be a numeric string (milliseconds)
      const numericTimestamp = parseInt(timestamp);
      eventTimestamp = new Date(
        isNaN(numericTimestamp) ? timestamp : numericTimestamp
      );
    } else {
      eventTimestamp = new Date(); // fallback to current time
    }

    // Validate the timestamp
    if (isNaN(eventTimestamp.getTime())) {
      logger.warn(`Invalid timestamp for topic ${topic}, using current time`, {
        originalTimestamp: timestamp,
        valueTimestamp: value.timestamp,
      });
      eventTimestamp = new Date();
    }

    switch (topic) {
      case ACTIVITY_TOPICS.USER_REGISTERED:
        return [this.createUserRegistrationActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.INSTITUTION_REGISTERED:
        return [
          this.createInstitutionRegistrationActivity(value, eventTimestamp),
        ];

      case ACTIVITY_TOPICS.INSTITUTION_UPDATED:
        return [this.createInstitutionUpdateActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.INSTITUTION_VERIFIED:
        return [
          this.createInstitutionVerificationActivity(value, eventTimestamp),
        ];

      case ACTIVITY_TOPICS.PRESCRIPTION_FILLED:
        return [this.createPrescriptionActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.LAB_ORDER_CREATED:
        return [this.createLabOrderActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.SOAP_NOTE_CREATED:
        return [this.createSoapNoteActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.QUICK_EXAM_CREATED:
        return [this.createQuickExamActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.CARE_PLAN_CREATED:
        return [this.createCarePlanActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.LAB_SAMPLE_CREATED:
        return this.createLabSampleActivity(value, eventTimestamp, "created");

      case ACTIVITY_TOPICS.LAB_SAMPLE_UPDATED:
        return this.createLabSampleActivity(value, eventTimestamp, "updated");

      case ACTIVITY_TOPICS.LAB_RESULT_PROCESSED:
        return this.createLabResultActivity(value, eventTimestamp, "processed");

      case ACTIVITY_TOPICS.LAB_RESULT_EXTRACTED:
        return this.createLabResultActivity(value, eventTimestamp, "extracted");

      // Lab management events
      case ACTIVITY_TOPICS.LAB_REGISTERED:
        return [this.createLabRegistrationActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.LAB_EQUIPMENT_ADDED:
        return [
          this.createLabEquipmentActivity(value, eventTimestamp, "added"),
        ];

      case ACTIVITY_TOPICS.LAB_EQUIPMENT_UPDATED:
        return [
          this.createLabEquipmentActivity(value, eventTimestamp, "updated"),
        ];

      case ACTIVITY_TOPICS.LAB_STAFF_ASSIGNED:
        return [this.createLabStaffActivity(value, eventTimestamp)];

      case ACTIVITY_TOPICS.LAB_WORKFLOW_UPDATED:
        return [this.createLabWorkflowActivity(value, eventTimestamp)];

      default:
        return null;
    }
  }

  private createUserRegistrationActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "user",
      entityId: value.userId || value.id,
      activityType: ACTIVITY_TYPES.USER_REGISTRATION,
      description: `User ${value.name || value.email || "Unknown"} registered`,
      timestamp,
      metadata: {
        email: value.email,
        name: value.name,
        role: value.role,
      },
      source: {
        service: "auth-service",
        topic: ACTIVITY_TOPICS.USER_REGISTERED,
      },
    };
  }

  private createInstitutionRegistrationActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "institution",
      entityId: value.institutionId || value.id,
      activityType: ACTIVITY_TYPES.INSTITUTION_REGISTRATION,
      description: `Institution ${value.name || "Unknown"} registered`,
      timestamp,
      metadata: {
        name: value.name,
        type: value.type,
        address: value.address,
      },
      source: {
        service: "institution-service",
        topic: ACTIVITY_TOPICS.INSTITUTION_REGISTERED,
      },
    };
  }

  private createInstitutionUpdateActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    const updatedFieldsText =
      value.updatedFields && value.updatedFields.length > 0
        ? value.updatedFields.join(", ")
        : "details";

    return {
      entityType: "institution",
      entityId: value.institutionId?.toString() || value.id?.toString(),
      activityType: ACTIVITY_TYPES.INSTITUTION_UPDATED,
      description: `${value.type === "clinic" ? "Clinic" : "Lab"} ${
        value.institutionName || "Unknown"
      } updated (${updatedFieldsText})`,
      timestamp,
      metadata: {
        institutionId: value.institutionId,
        institutionName: value.institutionName,
        type: value.type,
        updatedFields: value.updatedFields || [],
        updatedBy: value.updatedBy,
      },
      source: {
        service: "institution-service",
        topic: ACTIVITY_TOPICS.INSTITUTION_UPDATED,
      },
    };
  }

  private createInstitutionVerificationActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "institution",
      entityId: value.institutionId?.toString() || value.id?.toString(),
      activityType: ACTIVITY_TYPES.INSTITUTION_VERIFIED,
      description: `${value.type === "clinic" ? "Clinic" : "Lab"} ${
        value.institutionName || "Unknown"
      } verified`,
      timestamp,
      metadata: {
        institutionId: value.institutionId,
        institutionName: value.institutionName,
        type: value.type,
        status: value.status,
        verifiedBy: value.verifiedBy,
      },
      source: {
        service: "institution-service",
        topic: ACTIVITY_TOPICS.INSTITUTION_VERIFIED,
      },
    };
  }

  private createPrescriptionActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "patient",
      entityId: value.patientId,
      activityType: ACTIVITY_TYPES.PRESCRIPTION_FILLED,
      description: `Prescription filled for ${
        value.medicationName || "medication"
      }`,
      timestamp,
      metadata: {
        prescriptionId: value.prescriptionId,
        medicationName: value.medicationName,
        dosage: value.dosage,
        doctorId: value.doctorId,
      },
      source: {
        service: "patient-record-service",
        topic: ACTIVITY_TOPICS.PRESCRIPTION_FILLED,
      },
    };
  }

  private createLabOrderActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "patient",
      entityId: value.patientId,
      activityType: ACTIVITY_TYPES.LAB_ORDER_CREATED,
      description: `Lab order created for ${value.testType || "tests"}`,
      timestamp,
      metadata: {
        labOrderId: value.labOrderId,
        testType: value.testType,
        doctorId: value.doctorId,
        urgency: value.urgency,
      },
      source: {
        service: "patient-record-service",
        topic: ACTIVITY_TOPICS.LAB_ORDER_CREATED,
      },
    };
  }

  private createSoapNoteActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "patient",
      entityId: value.patientId,
      activityType: ACTIVITY_TYPES.SOAP_NOTE_CREATED,
      description: `SOAP note created`,
      timestamp,
      metadata: {
        soapNoteId: value.soapNoteId,
        doctorId: value.doctorId,
        chiefComplaint: value.chiefComplaint,
      },
      source: {
        service: "patient-record-service",
        topic: ACTIVITY_TOPICS.SOAP_NOTE_CREATED,
      },
    };
  }

  private createQuickExamActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "patient",
      entityId: value.patientId,
      activityType: ACTIVITY_TYPES.QUICK_EXAM_CREATED,
      description: `Quick examination completed`,
      timestamp,
      metadata: {
        examId: value.examId,
        doctorId: value.doctorId,
        examType: value.examType,
      },
      source: {
        service: "patient-record-service",
        topic: ACTIVITY_TOPICS.QUICK_EXAM_CREATED,
      },
    };
  }

  private createCarePlanActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "patient",
      entityId: value.patientId,
      activityType: ACTIVITY_TYPES.CARE_PLAN_CREATED,
      description: `Care plan created`,
      timestamp,
      metadata: {
        carePlanId: value.carePlanId,
        doctorId: value.doctorId,
        goals: value.goals,
      },
      source: {
        service: "patient-record-service",
        topic: ACTIVITY_TOPICS.CARE_PLAN_CREATED,
      },
    };
  }

  private createLabSampleActivity(
    value: any,
    timestamp: Date,
    action: "created" | "updated"
  ): Omit<ActivityEvent, "id">[] {
    const activities: Omit<ActivityEvent, "id">[] = [];

    // Create patient activity
    activities.push({
      entityType: "patient",
      entityId: value.patientId,
      activityType:
        action === "created"
          ? ACTIVITY_TYPES.LAB_SAMPLE_CREATED
          : ACTIVITY_TYPES.LAB_SAMPLE_UPDATED,
      description: `Lab sample ${action}`,
      timestamp,
      metadata: {
        sampleId: value.sampleId,
        sampleType: value.sampleType,
        labOrderId: value.labOrderId,
        status: value.status,
      },
      source: {
        service: "lab-report-service",
        topic:
          action === "created"
            ? ACTIVITY_TOPICS.LAB_SAMPLE_CREATED
            : ACTIVITY_TOPICS.LAB_SAMPLE_UPDATED,
      },
    });

    // Create lab activity (assuming labId is available in the value)
    if (value.labId) {
      activities.push({
        entityType: "lab",
        entityId: value.labId,
        activityType:
          action === "created"
            ? ACTIVITY_TYPES.LAB_SAMPLE_CREATED
            : ACTIVITY_TYPES.LAB_SAMPLE_UPDATED,
        description: `Sample ${action} for patient ${value.patientId}`,
        timestamp,
        metadata: {
          sampleId: value.sampleId,
          sampleType: value.sampleType,
          labOrderId: value.labOrderId,
          patientId: value.patientId,
          status: value.status,
        },
        source: {
          service: "lab-report-service",
          topic:
            action === "created"
              ? ACTIVITY_TOPICS.LAB_SAMPLE_CREATED
              : ACTIVITY_TOPICS.LAB_SAMPLE_UPDATED,
        },
      });
    }

    return activities;
  }

  private createLabResultActivity(
    value: any,
    timestamp: Date,
    action: "processed" | "extracted"
  ): Omit<ActivityEvent, "id">[] {
    const activities: Omit<ActivityEvent, "id">[] = [];

    // Create patient activity
    activities.push({
      entityType: "patient",
      entityId: value.patientId,
      activityType:
        action === "processed"
          ? ACTIVITY_TYPES.LAB_RESULT_PROCESSED
          : ACTIVITY_TYPES.LAB_RESULT_EXTRACTED,
      description: `Lab result ${action}`,
      timestamp,
      metadata: {
        resultId: value.resultId,
        sampleId: value.sampleId,
        testType: value.testType,
        status: value.status,
      },
      source: {
        service: "lab-report-service",
        topic:
          action === "processed"
            ? ACTIVITY_TOPICS.LAB_RESULT_PROCESSED
            : ACTIVITY_TOPICS.LAB_RESULT_EXTRACTED,
      },
    });

    // Create lab activity (assuming labId is available in the value)
    if (value.labId) {
      activities.push({
        entityType: "lab",
        entityId: value.labId,
        activityType:
          action === "processed"
            ? ACTIVITY_TYPES.LAB_RESULT_PROCESSED
            : ACTIVITY_TYPES.LAB_RESULT_EXTRACTED,
        description: `Result ${action} for patient ${value.patientId}`,
        timestamp,
        metadata: {
          resultId: value.resultId,
          sampleId: value.sampleId,
          testType: value.testType,
          patientId: value.patientId,
          status: value.status,
        },
        source: {
          service: "lab-report-service",
          topic:
            action === "processed"
              ? ACTIVITY_TOPICS.LAB_RESULT_PROCESSED
              : ACTIVITY_TOPICS.LAB_RESULT_EXTRACTED,
        },
      });
    }

    return activities;
  }

  private createLabRegistrationActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "lab",
      entityId: value.labId || value.id,
      activityType: ACTIVITY_TYPES.LAB_REGISTRATION,
      description: `Lab ${value.name || "Unknown"} registered`,
      timestamp,
      metadata: {
        name: value.name,
        type: value.type,
        location: value.location,
        institutionId: value.institutionId,
        capabilities: value.capabilities,
      },
      source: {
        service: "lab-management-service",
        topic: ACTIVITY_TOPICS.LAB_REGISTERED,
      },
    };
  }

  private createLabEquipmentActivity(
    value: any,
    timestamp: Date,
    action: "added" | "updated"
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "lab",
      entityId: value.labId,
      activityType:
        action === "added"
          ? ACTIVITY_TYPES.LAB_EQUIPMENT_ADDED
          : ACTIVITY_TYPES.LAB_EQUIPMENT_UPDATED,
      description: `Lab equipment ${value.equipmentName || "item"} ${action}`,
      timestamp,
      metadata: {
        equipmentId: value.equipmentId,
        equipmentName: value.equipmentName,
        equipmentType: value.equipmentType,
        manufacturer: value.manufacturer,
        model: value.model,
        status: value.status,
      },
      source: {
        service: "lab-management-service",
        topic:
          action === "added"
            ? ACTIVITY_TOPICS.LAB_EQUIPMENT_ADDED
            : ACTIVITY_TOPICS.LAB_EQUIPMENT_UPDATED,
      },
    };
  }

  private createLabStaffActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "lab",
      entityId: value.labId,
      activityType: ACTIVITY_TYPES.LAB_STAFF_ASSIGNED,
      description: `Staff ${value.staffName || "member"} assigned to lab`,
      timestamp,
      metadata: {
        staffId: value.staffId,
        staffName: value.staffName,
        role: value.role,
        department: value.department,
        assignmentType: value.assignmentType,
      },
      source: {
        service: "lab-management-service",
        topic: ACTIVITY_TOPICS.LAB_STAFF_ASSIGNED,
      },
    };
  }

  private createLabWorkflowActivity(
    value: any,
    timestamp: Date
  ): Omit<ActivityEvent, "id"> {
    return {
      entityType: "lab",
      entityId: value.labId,
      activityType: ACTIVITY_TYPES.LAB_WORKFLOW_UPDATED,
      description: `Lab workflow ${value.workflowName || "process"} updated`,
      timestamp,
      metadata: {
        workflowId: value.workflowId,
        workflowName: value.workflowName,
        workflowType: value.workflowType,
        changes: value.changes,
        updatedBy: value.updatedBy,
      },
      source: {
        service: "lab-management-service",
        topic: ACTIVITY_TOPICS.LAB_WORKFLOW_UPDATED,
      },
    };
  }
}
