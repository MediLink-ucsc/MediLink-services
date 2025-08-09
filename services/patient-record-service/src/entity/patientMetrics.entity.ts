import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from 'typeorm';

@Entity()
export class PatientMetrics {
  @PrimaryGeneratedColumn("uuid")
  id: String;

  @Column()
  date: string;

  @Column("decimal")
  weight: number;

  @Column("decimal", { nullable: true})
  sugarLevel: number;

  @Column("decimal", { nullable: true })
  waterIntake: number;

  @CreateDateColumn()
  createdAt: Date;

  // @UpdateDateColumn()
  // updatedAt: Date;
}