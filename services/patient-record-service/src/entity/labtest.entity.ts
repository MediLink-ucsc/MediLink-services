import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { LabOrder } from './laborder.entity';

@Entity()
export class LabTest {
  @PrimaryGeneratedColumn()
  labTestId: number;

  @Column()
  name: string;

  @Column({ default: 'Routine' })
  urgency: string;

  @Column({ nullable: true })
  specialInstructions: string;

  @ManyToOne(() => LabOrder, (labOrder) => labOrder.labTests)
  labOrder: LabOrder;
}
