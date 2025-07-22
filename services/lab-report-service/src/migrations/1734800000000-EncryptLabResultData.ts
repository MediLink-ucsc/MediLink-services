import { MigrationInterface, QueryRunner } from "typeorm";

export class EncryptLabResultData1734800000000 implements MigrationInterface {
  name = "EncryptLabResultData1734800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, backup existing data (optional but recommended)
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS lab_result_backup AS 
            SELECT * FROM lab_result WHERE extracted_data IS NOT NULL;
        `);

    // Handle existing NULL values by setting them to empty JSON for now
    await queryRunner.query(`
            UPDATE lab_result 
            SET extracted_data = '{}' 
            WHERE extracted_data IS NULL;
        `);

    // Change column type from jsonb to text for encrypted storage
    await queryRunner.query(`
            ALTER TABLE "lab_result" 
            ALTER COLUMN "extracted_data" TYPE text;
        `);

    // Note: Existing data will need to be re-encrypted manually
    // You might want to run a data migration script separately
    console.log(
      "⚠️  Warning: Existing extractedData needs to be re-encrypted!"
    );
    console.log("📝 Backup created in lab_result_backup table");
    console.log("🔄 NULL values converted to empty JSON objects");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // First, restore original data from backup if it exists
    const backupExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'lab_result_backup'
            );
        `);

    if (backupExists[0].exists) {
      console.log("📝 Restoring data from backup...");

      // Restore original data
      await queryRunner.query(`
                UPDATE lab_result 
                SET extracted_data = backup.extracted_data 
                FROM lab_result_backup backup 
                WHERE lab_result.id = backup.id;
            `);
    }

    // Revert column type back to jsonb
    await queryRunner.query(`
            ALTER TABLE "lab_result" 
            ALTER COLUMN "extracted_data" TYPE jsonb USING 
            CASE 
                WHEN extracted_data = '{}' THEN NULL::jsonb
                ELSE extracted_data::jsonb 
            END;
        `);

    // Drop backup table
    await queryRunner.query(`
            DROP TABLE IF EXISTS lab_result_backup;
        `);

    console.log("✅ Migration reverted successfully");
  }
}
