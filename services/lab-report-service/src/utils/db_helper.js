#!/usr/bin/env node

/**
 * Database helper script for Python extraction processes.
 * This script provides database access to Python parsers.
 */

// For TypeScript support, we need to import from the compiled files or use proper paths
const { AppDataSource } = require("../data-source.ts");
const { TestTypes } = require("../entity/testType.entity.ts");

async function initializeDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    return true;
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    return false;
  }
}

async function getTestType(testTypeId) {
  try {
    const testTypesRepository = AppDataSource.getRepository(TestTypes);
    const testType = await testTypesRepository.findOne({
      where: { id: parseInt(testTypeId) },
    });

    if (!testType) {
      throw new Error(`Test type with ID ${testTypeId} not found`);
    }

    // Convert entity to plain object with getters resolved
    const config = {
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

    return config;
  } catch (error) {
    throw new Error(`Failed to get test type: ${error.message}`);
  }
}

async function getTestTypeByFormat(format) {
  try {
    const testTypesRepository = AppDataSource.getRepository(TestTypes);

    // Map format to test type value
    const formatMapping = {
      fbc: "fbc",
      lab_report: "lab_report",
      prescription: "prescription",
      patient_details: "patient_details",
    };

    const testTypeValue = formatMapping[format];
    if (!testTypeValue) {
      throw new Error(`Unknown format: ${format}`);
    }

    const testType = await testTypesRepository.findOne({
      where: { value: testTypeValue },
    });

    if (!testType) {
      throw new Error(`Test type for format ${format} not found`);
    }

    // Convert entity to plain object with getters resolved
    const config = {
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

    return config;
  } catch (error) {
    throw new Error(`Failed to get test type by format: ${error.message}`);
  }
}

async function getAllTestTypes() {
  try {
    const testTypesRepository = AppDataSource.getRepository(TestTypes);
    const testTypes = await testTypesRepository.find();

    return testTypes.map((testType) => ({
      id: testType.id,
      value: testType.value,
      label: testType.label,
      category: testType.category,
      parser_module: testType.parserModule,
      parser_class: testType.parserClass,
      report_fields: testType.reportFields,
      reference_ranges: testType.referenceRanges,
      basic_fields: testType.basicFields,
    }));
  } catch (error) {
    throw new Error(`Failed to get all test types: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: node db_helper.js <command> [args...]");
    console.error("Commands:");
    console.error("  getTestType <id>        - Get test type by ID");
    console.error("  getTestTypeByFormat <format> - Get test type by format");
    console.error("  getAllTestTypes         - Get all test types");
    process.exit(1);
  }

  const command = args[0];

  try {
    const initialized = await initializeDatabase();
    if (!initialized) {
      throw new Error("Database initialization failed");
    }

    let result;

    switch (command) {
      case "getTestType":
        if (args.length < 2) {
          throw new Error("Test type ID required");
        }
        result = await getTestType(args[1]);
        break;

      case "getTestTypeByFormat":
        if (args.length < 2) {
          throw new Error("Format required");
        }
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
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = {
  getTestType,
  getTestTypeByFormat,
  getAllTestTypes,
};
