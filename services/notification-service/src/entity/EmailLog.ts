import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum EmailStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  DELIVERED = "delivered",
  BOUNCED = "bounced",
  SPAM = "spam",
}

export enum EmailType {
  PASSWORD_RESET = "password_reset",
  USER_ONBOARDING = "user_onboarding",
  WELCOME = "welcome",
  EMAIL_VERIFICATION = "email_verification",
  LAB_REPORT = "lab_report",
  CLINIC_VISIT = "clinic_visit",
  APPOINTMENT_REMINDER = "appointment_reminder",
  GENERAL = "general",
}

@Entity("email_logs")
@Index(["recipientEmail", "createdAt"])
@Index(["status", "createdAt"])
@Index(["emailType", "createdAt"])
export class EmailLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  recipientEmail: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  recipientName?: string;

  @Column({ type: "varchar", length: 255 })
  senderEmail: string;

  @Column({ type: "varchar", length: 255 })
  senderName: string;

  @Column({ type: "varchar", length: 500 })
  subject: string;

  @Column({ type: "text" })
  htmlContent: string;

  @Column({ type: "text", nullable: true })
  textContent?: string;

  @Column({
    type: "enum",
    enum: EmailType,
    default: EmailType.GENERAL,
  })
  emailType: EmailType;

  @Column({
    type: "enum",
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  brevoMessageId?: string;

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "int", default: 0 })
  retryCount: number;

  @Column({ type: "timestamp", nullable: true })
  sentAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  deliveredAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
