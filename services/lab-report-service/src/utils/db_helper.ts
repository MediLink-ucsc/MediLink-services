#!/usr/bin/env ts-node
import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { AppDataSource } from "../data-source";
import { TestTypes } from "../entity/testType.entity";

async function initializeDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await ensureSeed();
    return true;
  } catch (error: any) {
    console.error("Database initialization failed:", error.message);
    return false;
  }
}

async function ensureSeed() {
  const repo = AppDataSource.getRepository(TestTypes);
  const existing = await repo.find();
  // Build a quick index by value for idempotent upsert
  const byValue = new Map(existing.map((e) => [e.value, e] as const));
  const seeds: Array<
    Partial<TestTypes> & { value: string; label: string; category: string }
  > = [
    {
      value: "CBC",
      label: "Complete Blood Count",
      category: "Hematology",
      parserModule: "parser_fbc_report",
      parserClass: "FBCReportParser",
      reportFields: [
        {
          name: "RBC",
          type: "decimal",
          required: true,
          unit: "x 10^12/L",
          normalRange: "4.5-5.5",
        },
        {
          name: "Hemoglobin",
          type: "decimal",
          required: true,
          unit: "g/dL",
          normalRange: "13.5-17.5",
        },
        {
          name: "Hematocrit",
          type: "decimal",
          required: true,
          unit: "%",
          normalRange: "41-53",
        },
        {
          name: "WBC",
          type: "decimal",
          required: true,
          unit: "x 10^9/L",
          normalRange: "4.0-11.0",
        },
        {
          name: "Platelets",
          type: "decimal",
          required: true,
          unit: "x 10^9/L",
          normalRange: "150-450",
        },
      ],
      referenceRanges: {
        RBC: { min: 4.5, max: 5.5, unit: "x 10^12/L", normalRange: "4.5-5.5" },
        Hemoglobin: {
          min: 13.5,
          max: 17.5,
          unit: "g/dL",
          normalRange: "13.5-17.5",
        },
        Hematocrit: { min: 41, max: 53, unit: "%", normalRange: "41-53" },
        WBC: { min: 4.0, max: 11.0, unit: "x 10^9/L", normalRange: "4.0-11.0" },
        Platelets: {
          min: 150,
          max: 450,
          unit: "x 10^9/L",
          normalRange: "150-450",
        },
      },
    },
    {
      value: "lab_report",
      label: "General Lab Report",
      category: "General",
      parserModule: "parser_lab_report",
      parserClass: "LabReportParser",
      reportFields: [
        {
          name: "Glucose",
          type: "decimal",
          required: true,
          unit: "mg/dL",
          normalRange: "70-100",
        },
        {
          name: "Cholesterol",
          type: "decimal",
          required: false,
          unit: "mg/dL",
          normalRange: "<200",
        },
        {
          name: "Creatinine",
          type: "decimal",
          required: false,
          unit: "mg/dL",
          normalRange: "0.6-1.2",
        },
      ],
      referenceRanges: {
        Glucose: { min: 70, max: 100, unit: "mg/dL", normalRange: "70-100" },
        Cholesterol: { max: 200, unit: "mg/dL", normalRange: "<200" },
        Creatinine: {
          min: 0.6,
          max: 1.2,
          unit: "mg/dL",
          normalRange: "0.6-1.2",
        },
      },
    },
    {
      value: "lipid_panel",
      label: "Lipid Panel",
      category: "Biochemistry",
      parserModule: "parser_lab_report",
      parserClass: "LabReportParser",
      reportFields: [
        {
          name: "Total Cholesterol",
          type: "decimal",
          required: true,
          unit: "mg/dL",
          normalRange: "<200",
        },
        {
          name: "HDL Cholesterol",
          type: "decimal",
          required: true,
          unit: "mg/dL",
          normalRange: ">40",
        },
        {
          name: "LDL Cholesterol",
          type: "decimal",
          required: true,
          unit: "mg/dL",
          normalRange: "<100",
        },
        {
          name: "Triglycerides",
          type: "decimal",
          required: true,
          unit: "mg/dL",
          normalRange: "<150",
        },
      ],
      referenceRanges: {
        "Total Cholesterol": { max: 200, unit: "mg/dL", normalRange: "<200" },
        "HDL Cholesterol": { min: 40, unit: "mg/dL", normalRange: ">40" },
        "LDL Cholesterol": { max: 100, unit: "mg/dL", normalRange: "<100" },
        Triglycerides: { max: 150, unit: "mg/dL", normalRange: "<150" },
      },
    },
    {
      value: "thyroid_function",
      label: "Thyroid Function Test",
      category: "Endocrinology",
      parserModule: "parser_lab_report",
      parserClass: "LabReportParser",
      reportFields: [
        {
          name: "TSH",
          type: "decimal",
          required: true,
          unit: "mIU/L",
          normalRange: "0.4-4.0",
        },
        {
          name: "Free T4",
          type: "decimal",
          required: true,
          unit: "ng/dL",
          normalRange: "0.8-1.8",
        },
        {
          name: "Free T3",
          type: "decimal",
          required: false,
          unit: "pg/mL",
          normalRange: "2.3-4.2",
        },
      ],
      referenceRanges: {
        TSH: { min: 0.4, max: 4.0, unit: "mIU/L", normalRange: "0.4-4.0" },
        "Free T4": {
          min: 0.8,
          max: 1.8,
          unit: "ng/dL",
          normalRange: "0.8-1.8",
        },
        "Free T3": {
          min: 2.3,
          max: 4.2,
          unit: "pg/mL",
          normalRange: "2.3-4.2",
        },
      },
    },
    {
      value: "prescription",
      label: "Prescription",
      category: "Prescription",
      parserModule: "parser_prescription",
      parserClass: "PrescriptionParser",
      reportFields: [],
      referenceRanges: {},
    },
    {
      value: "patient_details",
      label: "Patient Details",
      category: "Patient",
      parserModule: "parser_patient_details",
      parserClass: "PatientDetailsParser",
      reportFields: [],
      referenceRanges: {},
    },
  ];

  const toSave: TestTypes[] = [];
  for (const seed of seeds) {
    if (!byValue.has(seed.value)) {
      const entity = repo.create();
      entity.value = seed.value;
      entity.label = seed.label;
      entity.category = seed.category;
      entity.parserClass = seed.parserClass as string;
      entity.parserModule = seed.parserModule as string;
      entity.reportFields = seed.reportFields as any;
      entity.referenceRanges = seed.referenceRanges as any;
      // Leave basicFields empty to auto-generate default
      toSave.push(entity);
    }
  }
  if (toSave.length) {
    await repo.save(toSave);
  }
}

async function getTestType(testTypeId: string) {
  try {
    const repo = AppDataSource.getRepository(TestTypes);
    const testType = await repo.findOne({
      where: { id: parseInt(testTypeId, 10) },
    });
    if (!testType) throw new Error(`Test type with ID ${testTypeId} not found`);
    return serialize(testType);
  } catch (error: any) {
    throw new Error(`Failed to get test type: ${error.message}`);
  }
}

async function getTestTypeByFormat(format: string) {
  try {
    const repo = AppDataSource.getRepository(TestTypes);
    const testType = await repo.findOne({ where: { value: format } });
    if (!testType) throw new Error(`Test type for format ${format} not found`);
    return serialize(testType);
  } catch (error: any) {
    throw new Error(`Failed to get test type by format: ${error.message}`);
  }
}

async function getAllTestTypes() {
  const repo = AppDataSource.getRepository(TestTypes);
  const list = await repo.find();
  return list.map(serialize);
}

function serialize(testType: TestTypes) {
  return {
    id: testType.id,
    value: testType.value,
    label: testType.label,
    category: testType.category,
    parser_module: testType.parserModule,
    parser_class: testType.parserClass,
    report_fields: testType.reportFields,
    reference_ranges: testType.referenceRanges,
    basic_fields: testType.basicFields,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: ts-node db_helper.ts <command> [args...]");
    process.exit(1);
  }
  const command = args[0];
  const initialized = await initializeDatabase();
  if (!initialized) throw new Error("Database initialization failed");
  try {
    let result: any;
    switch (command) {
      case "getTestType":
        if (!args[1]) throw new Error("Test type ID required");
        result = await getTestType(args[1]);
        break;
      case "getTestTypeByFormat":
        if (!args[1]) throw new Error("Format required");
        result = await getTestTypeByFormat(args[1]);
        break;
      case "getAllTestTypes":
        result = await getAllTestTypes();
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (e: any) {
    console.error("Error:", e.message);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error("Unhandled error:", e);
    process.exit(1);
  });
}

export { getTestType, getTestTypeByFormat, getAllTestTypes };
