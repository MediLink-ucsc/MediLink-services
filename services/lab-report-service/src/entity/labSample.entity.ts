import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { TestTypes } from "./testType.entity";
import { LabResult } from "./labResult.entity";

@Entity()
export class LabSample {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "labId" })
  labId: string;

  @Column({ name: "barcode" })
  barcode: string;

  @Column({ name: "testTypeId" })
  testTypeId: number;

  @ManyToOne(() => TestTypes, { eager: true })
  @JoinColumn({ name: "testTypeId" })
  testType: TestTypes;

  @Column({ name: "sampleType" })
  sampleType: string;

  @Column({ name: "volume" })
  volume: string;

  @Column({ name: "container" })
  container: string;

  @Column({ name: "patientId" })
  patientId: string;

  @OneToMany(() => LabResult, (labResult) => labResult.labSample)
  labResults: LabResult[];

  @Column({
    name: "createdAt",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({ name: "expectedTime" })
  expectedTime: Date;

  @Column({
    name: "updatedAt",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({ name: "status", default: "pending" })
  status: string; // pending, in-progress, completed, failed

  @Column({ name: "priority", default: "normal" })
  priority: string; // low, normal, high, urgent

  @Column({ name: "notes", nullable: true })
  notes?: string;
}
