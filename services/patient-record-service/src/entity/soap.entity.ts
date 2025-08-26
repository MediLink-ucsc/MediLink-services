import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'soap_notes' })
export class SoapNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: string;

  @Column()
  doctorUserId: number;

  @Column({ type: 'timestamp' })
  dateTime: Date;

  @Column({ type: 'text' })
  subjective: string;

  @Column({ type: 'text' })
  objective: string;

  @Column({ type: 'text' })
  assessment: string;

  @Column({ type: 'text' })
  plan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
