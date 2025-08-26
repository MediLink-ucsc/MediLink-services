import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class QuickExam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: string;

  @Column()
  doctorUserId: number;

  @Column({ length: 20, nullable: true })
  bloodPressure?: string; // e.g. "120/80"

  @Column({ type: 'int', nullable: true })
  heartRate?: number; // bpm

  @Column({ type: 'float', nullable: true })
  temperature?: number; // Celsius

  @Column({ type: 'int', nullable: true })
  spo2?: number; // %

  @Column({ type: 'float', nullable: true })
  weight?: number; // kg

  @Column({ type: 'int', nullable: true })
  height?: number; // cm

  @Column({ type: 'text', nullable: true })
  generalAppearance?: string;

  @Column({ type: 'text', nullable: true })
  cardiovascular?: string;

  @Column({ type: 'text', nullable: true })
  respiratory?: string;

  @Column({ type: 'text', nullable: true })
  abdominal?: string;

  @Column({ type: 'text', nullable: true })
  neurological?: string;

  @Column({ type: 'text', nullable: true })
  additionalNotes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
