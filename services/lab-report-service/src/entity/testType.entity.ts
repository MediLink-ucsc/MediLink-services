import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

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

  // Parser configuration
  @Column({ name: "parser_class", nullable: true })
  parserClass: string; // e.g., "FBCReportParser", "LabReportParser"

  @Column({ name: "parser_module", nullable: true })
  parserModule: string; // e.g., "parser_fbc_report", "parser_lab_report"

  // Report template configuration stored as JSON
  @Column({ name: "report_fields", type: "text", nullable: true })
  private reportFieldsJson: string;

  // Reference ranges for this test type
  @Column({ name: "reference_ranges", type: "text", nullable: true })
  private referenceRangesJson: string;

  // Basic report requirements (patient info, etc.)
  @Column({ name: "basic_fields", type: "text", nullable: true })
  private basicFieldsJson: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Getters and setters for JSON fields
  get reportFields(): Array<{
    name: string;
    type: string;
    required: boolean;
    unit?: string;
    normalRange?: string;
  }> {
    try {
      return this.reportFieldsJson ? JSON.parse(this.reportFieldsJson) : [];
    } catch {
      return [];
    }
  }

  set reportFields(
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      unit?: string;
      normalRange?: string;
    }>
  ) {
    this.reportFieldsJson = JSON.stringify(fields);
  }

  get referenceRanges(): Record<
    string,
    {
      min?: number;
      max?: number;
      unit: string;
      normalRange: string;
    }
  > {
    try {
      return this.referenceRangesJson
        ? JSON.parse(this.referenceRangesJson)
        : {};
    } catch {
      return {};
    }
  }

  set referenceRanges(
    ranges: Record<
      string,
      {
        min?: number;
        max?: number;
        unit: string;
        normalRange: string;
      }
    >
  ) {
    this.referenceRangesJson = JSON.stringify(ranges);
  }

  get basicFields(): Array<{
    name: string;
    required: boolean;
    patterns: string[];
  }> {
    try {
      return this.basicFieldsJson
        ? JSON.parse(this.basicFieldsJson)
        : this.getDefaultBasicFields();
    } catch {
      return this.getDefaultBasicFields();
    }
  }

  set basicFields(
    fields: Array<{
      name: string;
      required: boolean;
      patterns: string[];
    }>
  ) {
    this.basicFieldsJson = JSON.stringify(fields);
  }

  private getDefaultBasicFields() {
    return [
      {
        name: "Patient",
        required: true,
        patterns: [
          "Patient:\\s*(.+)",
          "Patient\\s*Name:\\s*(.+)",
          "Name:\\s*(.+)",
        ],
      },
      {
        name: "Date",
        required: true,
        patterns: [
          "Date:\\s*(.+)",
          "Collection\\s*Date:\\s*(.+)",
          "Report\\s*Date:\\s*(.+)",
        ],
      },
      {
        name: "Doctor",
        required: false,
        patterns: [
          "Doctor:\\s*(.+)",
          "Ordering\\s*Physician:\\s*(.+)",
          "Physician:\\s*(.+)",
        ],
      },
      {
        name: "Laboratory",
        required: true,
        patterns: [
          "Laboratory:\\s*(.+)",
          "Lab:\\s*(.+)",
          "CENTRAL\\s*MEDICAL\\s*LABORATORY",
        ],
      },
    ];
  }
}
