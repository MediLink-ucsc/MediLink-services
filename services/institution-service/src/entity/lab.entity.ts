import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Institution } from './institution.entity';

@Entity()
export class Lab {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column({
    name: 'license_number',
    length: 50,
    nullable: true,
    comment: 'Lab accreditation or license number',
  })
  licenseNumber: string;

  @Column({
    name: 'license_expiry_date',
    type: 'date',
    nullable: true,
  })
  licenseExpiryDate: Date;

  @Column({
    name: 'head_technologist_name',
    length: 100,
    nullable: true,
  })
  headTechnologistName: string;

  @Column({
    name: 'available_tests',
    type: 'text',
    nullable: true,
    comment: 'Could store JSON string or comma-separated list',
  })
  availableTests: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
