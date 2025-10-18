// All Kafka topics that the activity timeline service subscribes to
export const ACTIVITY_TOPICS = {
  // User management topics
  USER_REGISTERED: "user.registered",
  INSTITUTION_REGISTERED: "institution.registered",
  INSTITUTION_UPDATED: "institution.updated",
  INSTITUTION_VERIFIED: "institution.verified",

  // Patient record topics
  PRESCRIPTION_FILLED: "prescription.filled",
  LAB_ORDER_CREATED: "laborder.created",
  SOAP_NOTE_CREATED: "soapnote.created",
  QUICK_EXAM_CREATED: "quickexam.created",
  CARE_PLAN_CREATED: "careplan.created",

  // Lab workflow topics
  LAB_SAMPLE_CREATED: "lab.sample.created",
  LAB_SAMPLE_UPDATED: "lab.sample.updated",
  LAB_RESULT_PROCESSED: "lab.result.processed",
  LAB_RESULT_EXTRACTED: "lab.result.extracted",

  // Lab management topics
  LAB_REGISTERED: "lab.registered",
  LAB_EQUIPMENT_ADDED: "lab.equipment.added",
  LAB_EQUIPMENT_UPDATED: "lab.equipment.updated",
  LAB_STAFF_ASSIGNED: "lab.staff.assigned",
  LAB_WORKFLOW_UPDATED: "lab.workflow.updated",
} as const;

export const ACTIVITY_TYPES = {
  USER_REGISTRATION: "user_registration",
  INSTITUTION_REGISTRATION: "institution_registration",
  INSTITUTION_UPDATED: "institution_updated",
  INSTITUTION_VERIFIED: "institution_verified",
  PRESCRIPTION_FILLED: "prescription_filled",
  LAB_ORDER_CREATED: "lab_order_created",
  SOAP_NOTE_CREATED: "soap_note_created",
  QUICK_EXAM_CREATED: "quick_exam_created",
  CARE_PLAN_CREATED: "care_plan_created",
  LAB_SAMPLE_CREATED: "lab_sample_created",
  LAB_SAMPLE_UPDATED: "lab_sample_updated",
  LAB_RESULT_PROCESSED: "lab_result_processed",
  LAB_RESULT_EXTRACTED: "lab_result_extracted",

  // Lab management activity types
  LAB_REGISTRATION: "lab_registration",
  LAB_EQUIPMENT_ADDED: "lab_equipment_added",
  LAB_EQUIPMENT_UPDATED: "lab_equipment_updated",
  LAB_STAFF_ASSIGNED: "lab_staff_assigned",
  LAB_WORKFLOW_UPDATED: "lab_workflow_updated",
} as const;

export const ENTITY_TYPES = {
  USER: "user",
  INSTITUTION: "institution",
  PATIENT: "patient",
  LAB: "lab",
} as const;
