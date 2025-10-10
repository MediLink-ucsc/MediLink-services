import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('password_reset_tokens')
@Index(['token'])
@Index(['userId', 'isUsed'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date;

  @Column({ type: 'inet', nullable: true })
  requestIp?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
