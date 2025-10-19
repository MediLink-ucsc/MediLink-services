import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PatientDoctorRecord {
  @PrimaryGeneratedColumn()
  id: number;

  // Reference IDs from auth-service
  @Column()
  patientId: number;

  @Column()
  doctorId: number;

  // Store last visit date
  @Column({ type: 'date', nullable: true })
  lastVisitedDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
