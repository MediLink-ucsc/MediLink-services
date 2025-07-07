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
export class Clinic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column({
    name: 'registration_number',
    length: 50,
    nullable: true,
    comment: 'Clinic registration or license number',
  })
  registrationNumber: string;

  @Column({
    name: 'registration_expiry_date',
    type: 'date',
    nullable: true,
  })
  registrationExpiryDate: Date;

  @Column({
    name: 'head_physician_name',
    length: 100,
    nullable: true,
  })
  headPhysicianName: string;

  @Column({
    name: 'specializations',
    type: 'text',
    nullable: true,
    comment: 'JSON string or comma-separated list of specializations',
  })
  specializations: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
