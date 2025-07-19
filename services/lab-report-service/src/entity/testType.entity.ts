import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class TestTypes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "value" })
  value: string;

  @Column({ name: "label" })
  label: string;

  @Column({ name: "category" })
  category: string;
}
