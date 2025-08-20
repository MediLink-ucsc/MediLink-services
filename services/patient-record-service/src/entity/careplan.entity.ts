import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CareTask } from './caretask.entity';

export enum PlanPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum PlanType {
  POST_SURGICAL_CARE = 'Post-Surgical Care',
  DIABETES_MANAGEMENT = 'Diabetes Management',
  HYPERTENSION_CARE = 'Hypertension Care',
  MEDICATION_MANAGEMENT = 'Medication Management',
  WOUND_CARE = 'Wound Care',
  MOBILITY_ASSISTANCE = 'Mobility Assistance',
  PAIN_MANAGEMENT = 'Pain Management',
  NUTRITIONAL_SUPPORT = 'Nutritional Support',
  RESPIRATORY_CARE = 'Respiratory Care',
  MENTAL_HEALTH_SUPPORT = 'Mental Health Support'
}

@Entity({ name: 'care_plans' })
export class CarePlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'patient_id' })
  patientId: string; 

  @Column({ name: 'nurse_id', nullable: true })
  nurseId: string;

  @Column({
    type: 'enum',
    enum: PlanType,
    })
    planType: PlanType;

  @Column({
    type: 'enum',
    enum: PlanPriority,
    default: PlanPriority.MEDIUM,
  })
  priority: PlanPriority;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  goals: string;

  @OneToMany(() => CareTask, (task) => task.carePlan, { cascade: true })
  tasks: CareTask[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
