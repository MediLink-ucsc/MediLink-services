import { DataSource } from 'typeorm';
import { Institution } from './entity/institution.entity';
import { Lab } from './entity/lab.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [Institution, Lab],
});