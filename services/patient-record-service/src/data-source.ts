import { DataSource } from 'typeorm';
import { PatientMetrics } from './entity/patientMetrics.entity';
import { PatientReport } from './entity/patientReport.entity';



export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [ PatientMetrics, PatientReport ], 

});
