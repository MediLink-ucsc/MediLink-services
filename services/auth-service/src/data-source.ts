import { DataSource } from 'typeorm';
import { User } from './entity/user.entity';
import { Credential } from './entity/credential.entity';
import { Patient } from './entity/patient.entity';
import { Doctor } from './entity/doctor.entity';
import { LabAssistant } from './entity/labAssistant.entity';
import { MedicalStaff } from './entity/medicalStaff.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [User, Credential, Patient, Doctor, LabAssistant, MedicalStaff], 

});
