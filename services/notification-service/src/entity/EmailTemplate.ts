import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum TemplateType {
  PASSWORD_RESET = "password_reset",
  USER_ONBOARDING = "user_onboarding",
  WELCOME = "welcome",
  EMAIL_VERIFICATION = "email_verification",
  LAB_REPORT = "lab_report",
  CLINIC_VISIT = "clinic_visit",
  APPOINTMENT_REMINDER = "appointment_reminder",
}

@Entity("email_templates")
@Index(["templateType"])
@Index(["isActive"])
export class EmailTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  templateType: TemplateType;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 500 })
  subject: string;

  @Column({ type: "text" })
  htmlTemplate: string;

  @Column({ type: "text", nullable: true })
  textTemplate?: string;

  @Column({ type: "jsonb", nullable: true })
  variables?: Record<string, string>; // Description of template variables

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "varchar", length: 50, default: "1.0" })
  version: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
