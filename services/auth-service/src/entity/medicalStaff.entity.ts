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
export class MedicalStaff {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  position: string; // e.g. "Nurse", "Attendant"

  @Column({ name: 'qualification', nullable: true })
  qualification: string;

  @Column({ name: 'department', nullable: true })
  department: string;

  @Column({ name: 'years_of_experience', type: 'int', default: 0 })
  yearsOfExperience: number;

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
