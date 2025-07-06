import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InstitutionType {
  CLINIC = 'clinic',
  LAB = 'lab',
  HOSPITAL = 'hospital',
}

export enum InstitutionStatus {
  PENDING = 'pending',  
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity()
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'institution_name',
    length: 100,
  })
  institutionName: string;

  @Column({
    name: 'institution_type',
    type: 'enum',
    enum: InstitutionType,
    default: InstitutionType.CLINIC,
  })
  institutionType: InstitutionType;

  @Column({
    name: 'contact_number',
    length: 15,
    nullable: true,
  })
  contactNumber: string;

  @Column({
    name: 'email',
    length: 100,
    nullable: true,
  })
  email: string;

  @Column({
    name: 'address',
    type: 'text',
    nullable: true,
  })
  address: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InstitutionStatus,
    default: InstitutionStatus.PENDING, 
  })
  status: InstitutionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
