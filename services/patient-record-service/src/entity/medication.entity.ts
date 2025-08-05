import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Prescription } from './prescription.entity';

@Entity()
export class Medication {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Prescription, (prescription) => prescription.medications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  @Column({ name: 'medicine_name', length: 100 })
  medicineName: string;

  @Column({ length: 50 })
  dosage: string;

  @Column({ length: 50 })
  frequency: string;

  @Column({ length: 50 })
  duration: string;
}

