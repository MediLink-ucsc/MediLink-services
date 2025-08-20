import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { CarePlan, PlanPriority } from './careplan.entity';

@Entity({ name: 'care_tasks' })
export class CareTask {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CarePlan, (carePlan) => carePlan.tasks, {
    onDelete: 'CASCADE',
  })
  carePlan: CarePlan;

  @Column({ name: 'task_description' })
  taskDescription: string;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: PlanPriority,
    default: PlanPriority.MEDIUM,
  })
  priority: PlanPriority;
}
