import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'float' })
  weight: number;

  @Column({ type: 'float', nullable: true })
  sugarLevel: number;

  @Column({ type: 'float', nullable: true })
  waterIntake: number;

  @CreateDateColumn()
  createdAt: Date;
}
