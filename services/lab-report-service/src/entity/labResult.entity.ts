import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { LabSample } from "./labSample.entity";

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

  @Column({ name: "extractedData", type: "jsonb" })
  extractedData: Record<string, any>;

  @Column({
    name: "createdAt",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({ name: "status", default: "processed" })
  status: string; // processed, failed, pending
}
