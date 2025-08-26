import { DataSource } from 'typeorm';
import { Medication } from './entity/medication.entity';
import { Prescription } from './entity/prescription.entity';
import { LabOrder } from './entity/laborder.entity';
import { LabTest } from './entity/labtest.entity';
import { SoapNote } from './entity/soap.entity';
import { QuickExam } from './entity/quickexam.entity';
import { CarePlan } from './entity/careplan.entity';
import { CareTask } from './entity/caretask.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [Prescription, Medication, LabOrder, LabTest, SoapNote, QuickExam, CarePlan, CareTask],
});