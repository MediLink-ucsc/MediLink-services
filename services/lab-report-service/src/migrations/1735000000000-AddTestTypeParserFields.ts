import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTestTypeParserFields1735000000000
  implements MigrationInterface
{
  name = "AddTestTypeParserFields1735000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Starting migration: Add test type parser fields");

    // Add new columns to test_types table
    await queryRunner.query(`
            ALTER TABLE "test_types" 
            ADD COLUMN "parser_class" varchar,
            ADD COLUMN "parser_module" varchar,
            ADD COLUMN "report_fields" text,
            ADD COLUMN "reference_ranges" text,
            ADD COLUMN "basic_fields" text,
            ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            ADD COLUMN "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        `);

    console.log("✅ Added parser configuration columns to test_types table");

    // Insert default test types with parser configurations
    await queryRunner.query(`
            INSERT INTO "test_types" (
                "value", 
                "label", 
                "category", 
                "parser_class", 
                "parser_module", 
                "report_fields", 
                "reference_ranges"
            ) VALUES 
            (
                'fbc',
                'Full Blood Count',
                'hematology',
                'FBCReportParser',
                'parser_fbc_report',
                '[
                    {"name": "RBC", "type": "number", "required": true, "unit": "x 10^12/L", "normalRange": "4.5-5.5"},
                    {"name": "Hemoglobin", "type": "number", "required": true, "unit": "g/dL", "normalRange": "13.5-17.5"},
                    {"name": "Hematocrit", "type": "number", "required": true, "unit": "%", "normalRange": "41-53"},
                    {"name": "MCV", "type": "number", "required": false, "unit": "fL", "normalRange": "80-100"},
                    {"name": "MCH", "type": "number", "required": false, "unit": "pg", "normalRange": "27-32"},
                    {"name": "MCHC", "type": "number", "required": false, "unit": "g/dL", "normalRange": "32-36"},
                    {"name": "WBC", "type": "number", "required": true, "unit": "x 10^9/L", "normalRange": "4.0-11.0"},
                    {"name": "Platelets", "type": "number", "required": true, "unit": "x 10^9/L", "normalRange": "150-450"},
                    {"name": "Neutrophils", "type": "number", "required": false, "unit": "%", "normalRange": "50-70"},
                    {"name": "Lymphocytes", "type": "number", "required": false, "unit": "%", "normalRange": "20-40"},
                    {"name": "Monocytes", "type": "number", "required": false, "unit": "%", "normalRange": "2-8"},
                    {"name": "Eosinophils", "type": "number", "required": false, "unit": "%", "normalRange": "1-4"},
                    {"name": "Basophils", "type": "number", "required": false, "unit": "%", "normalRange": "0-1"},
                    {"name": "ESR", "type": "number", "required": false, "unit": "mm/hr", "normalRange": "0-20"}
                ]',
                '{
                    "RBC": {"min": 4.5, "max": 5.5, "unit": "x 10^12/L", "normalRange": "4.5-5.5"},
                    "Hemoglobin": {"min": 13.5, "max": 17.5, "unit": "g/dL", "normalRange": "13.5-17.5"},
                    "Hematocrit": {"min": 41, "max": 53, "unit": "%", "normalRange": "41-53"},
                    "MCV": {"min": 80, "max": 100, "unit": "fL", "normalRange": "80-100"},
                    "MCH": {"min": 27, "max": 32, "unit": "pg", "normalRange": "27-32"},
                    "MCHC": {"min": 32, "max": 36, "unit": "g/dL", "normalRange": "32-36"},
                    "WBC": {"min": 4.0, "max": 11.0, "unit": "x 10^9/L", "normalRange": "4.0-11.0"},
                    "Platelets": {"min": 150, "max": 450, "unit": "x 10^9/L", "normalRange": "150-450"},
                    "Neutrophils": {"min": 50, "max": 70, "unit": "%", "normalRange": "50-70"},
                    "Lymphocytes": {"min": 20, "max": 40, "unit": "%", "normalRange": "20-40"},
                    "Monocytes": {"min": 2, "max": 8, "unit": "%", "normalRange": "2-8"},
                    "Eosinophils": {"min": 1, "max": 4, "unit": "%", "normalRange": "1-4"},
                    "Basophils": {"min": 0, "max": 1, "unit": "%", "normalRange": "0-1"},
                    "ESR": {"max": 20, "unit": "mm/hr", "normalRange": "0-20"}
                }'
            ),
            (
                'lab_report',
                'General Lab Report',
                'general',
                'LabReportParser',
                'parser_lab_report',
                '[
                    {"name": "Glucose", "type": "number", "required": true, "unit": "mg/dL", "normalRange": "70-100"},
                    {"name": "Cholesterol", "type": "number", "required": false, "unit": "mg/dL", "normalRange": "<200"},
                    {"name": "Creatinine", "type": "number", "required": false, "unit": "mg/dL", "normalRange": "0.6-1.2"},
                    {"name": "Sodium", "type": "number", "required": false, "unit": "mEq/L", "normalRange": "136-145"},
                    {"name": "Potassium", "type": "number", "required": false, "unit": "mEq/L", "normalRange": "3.5-5.0"},
                    {"name": "BUN", "type": "number", "required": false, "unit": "mg/dL", "normalRange": "7-20"}
                ]',
                '{
                    "Glucose": {"min": 70, "max": 100, "unit": "mg/dL", "normalRange": "70-100"},
                    "Cholesterol": {"max": 200, "unit": "mg/dL", "normalRange": "<200"},
                    "Creatinine": {"min": 0.6, "max": 1.2, "unit": "mg/dL", "normalRange": "0.6-1.2"},
                    "Sodium": {"min": 136, "max": 145, "unit": "mEq/L", "normalRange": "136-145"},
                    "Potassium": {"min": 3.5, "max": 5.0, "unit": "mEq/L", "normalRange": "3.5-5.0"},
                    "BUN": {"min": 7, "max": 20, "unit": "mg/dL", "normalRange": "7-20"}
                }'
            )
            ON CONFLICT ("value") DO UPDATE SET
                "label" = EXCLUDED."label",
                "category" = EXCLUDED."category",
                "parser_class" = EXCLUDED."parser_class",
                "parser_module" = EXCLUDED."parser_module",
                "report_fields" = EXCLUDED."report_fields",
                "reference_ranges" = EXCLUDED."reference_ranges",
                "updated_at" = now()
        `);

    console.log("✅ Inserted default test types with parser configurations");
    console.log("✅ Migration completed successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔄 Reverting migration: Remove test type parser fields");

    // Remove the added columns
    await queryRunner.query(`
            ALTER TABLE "test_types" 
            DROP COLUMN IF EXISTS "parser_class",
            DROP COLUMN IF EXISTS "parser_module",
            DROP COLUMN IF EXISTS "report_fields",
            DROP COLUMN IF EXISTS "reference_ranges",
            DROP COLUMN IF EXISTS "basic_fields",
            DROP COLUMN IF EXISTS "created_at",
            DROP COLUMN IF EXISTS "updated_at"
        `);

    console.log("✅ Migration reverted successfully");
  }
}
