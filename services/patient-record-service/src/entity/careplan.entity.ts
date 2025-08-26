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


@Entity({ name: 'care_plans' })
export class CarePlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'patient_id' })
  patientId: string; 

  @Column({ name: 'nurse_id', nullable: true })
  nurseId: string;

   @Column({ name: 'plan_type', type: 'varchar', length: 100 })
  planType: string; // Example: "Post-Surgical Care"

  @Column({ name: 'priority', type: 'varchar', length: 50, default: 'Medium' })
  priority: string;

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
