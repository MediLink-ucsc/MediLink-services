import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class LabAssistant {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'qualification' })
  qualification: string;

  @Column({ name: 'department' })
  department: string;

  @Column({ name: 'years_of_experience' })
  yearsOfExperience: number;

  @Column({ name: 'contact_number' })
  contactNumber: string;

  @Column({ name: 'lab_id', nullable: true })
  labId: number;

  @Column({ name: 'lab_name', nullable: true })
  labName: string;

  @Column({ name: 'hospital_id', nullable: true })
  hospitalId: number;

  @Column({ name: 'hospital_name', nullable: true })
  hospitalName: string;

  @Column({ name: 'gender', nullable: true })
  gender: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

