import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("activity_events")
@Index(["entityType", "entityId", "timestamp"])
@Index(["entityId", "activityType", "timestamp"])
@Index(["timestamp"])
export class ActivityEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "enum",
    enum: ["user", "institution", "patient", "lab"],
  })
  entityType!: "user" | "institution" | "patient" | "lab";

  @Column()
  entityId!: string;

  @Column()
  activityType!: string;

  @Column("text")
  description!: string;

  @Column({ type: "timestamp with time zone" })
  timestamp!: Date;

  @Column("jsonb", { default: {} })
  metadata!: Record<string, any>;

  @Column("jsonb")
  source!: {
    service: string;
    topic: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
