import { DataSource } from "typeorm";
import { TestTypes } from "./entity/testType.entity";
import { LabSample } from "./entity/labSample.entity";
import { LabResult } from "./entity/labResult.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [TestTypes, LabSample, LabResult],
});
