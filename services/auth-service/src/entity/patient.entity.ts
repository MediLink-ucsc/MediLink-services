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
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  age: number;

  @Column()
  gender: string;

  @Column({ name: 'last_visited', type: 'varchar', default: 'Not Updated' })
  lastVisited: string;

  // Condition column with default "Not Updated"
  @Column({ type: 'varchar', default: 'Not Updated' })
  condition: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
