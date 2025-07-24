import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Lab {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'institution_name', length: 150 })
  institutionName: string;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column({ name: 'province_state', length: 100 })
  provinceState: string;

  @Column({ name: 'postal_code', length: 20 })
  postalCode: string;

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @Column({ name: 'email_address', length: 100 })
  emailAddress: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ name: 'license_number', length: 50 })
  licenseNumber: string;

  @Column({ name: 'institution_logo', nullable: true })
  institutionLogo: string;

  @Column({ name: 'admin_user_id' })
  adminUserId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

