import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { LabTest } from './labtest.entity';

@Entity()
export class LabOrder {
  @PrimaryGeneratedColumn()
  labOrderId: number;

  @Column()
  patientId: number;

  @Column()
  doctorUserId: number;

  @Column({ nullable: true })
  clinicalInformation: string;

  @OneToMany(() => LabTest, (labTest) => labTest.labOrder, { cascade: true })
  labTests: LabTest[];

  @CreateDateColumn()
  createdAt: Date;
}

