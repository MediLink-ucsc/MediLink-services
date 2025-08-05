import { DataSource } from 'typeorm';
import { Medication } from './entity/medication.entity';
import { Prescription } from './entity/prescription.entity';


export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [Prescription, Medication],
});