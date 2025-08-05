import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Medication } from './medication.entity';

@Entity()
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column({ type: 'text', nullable: true })
  additionalInstructions: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Medication, (medication) => medication.prescription, {
    cascade: true,
  })
  medications: Medication[];
}
