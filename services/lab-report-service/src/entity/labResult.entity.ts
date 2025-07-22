import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from "typeorm";
import { LabSample } from "./labSample.entity";
import { encryptionService } from "../utils/encryption.util";

@Entity()
export class LabResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "labSampleId" })
  labSampleId: number;

  @ManyToOne(() => LabSample, (labSample) => labSample.labResults)
  @JoinColumn({ name: "labSampleId" })
  labSample: LabSample;

  @Column({ name: "reportUrl" })
  reportUrl: string;

  // Store encrypted data as text in database (nullable to handle existing data)
  @Column({ name: "extractedData", type: "text", nullable: true })
  private encryptedExtractedData: string | null;

  // This field won't be persisted to database, used for application logic
  extractedData: Record<string, any>;

  @Column({
    name: "createdAt",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({ name: "status", default: "processed" })
  status: string; // processed, failed, pending

  // Encrypt data before saving to database
  @BeforeInsert()
  @BeforeUpdate()
  encryptData() {
    if (this.extractedData) {
      this.encryptedExtractedData = encryptionService.encrypt(
        this.extractedData
      );
      // Clear the plain data from memory after encryption
      this.extractedData = {};
    }
  }

  // Decrypt data after loading from database
  @AfterLoad()
  decryptData() {
    if (this.encryptedExtractedData) {
      try {
        this.extractedData = encryptionService.decrypt(
          this.encryptedExtractedData
        );
      } catch (error) {
        console.error("Failed to decrypt lab result data:", error);
        this.extractedData = {};
      }
    } else {
      // Handle null/undefined encrypted data (for existing records)
      this.extractedData = {};
    }
  }

  // Method to manually set extracted data (for API usage)
  setExtractedData(data: Record<string, any>) {
    this.extractedData = data;
  }

  // Method to get decrypted data safely
  getExtractedData(): Record<string, any> {
    return this.extractedData || {};
  }
}
