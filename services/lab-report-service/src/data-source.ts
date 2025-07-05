import { DataSource } from "typeorm";
import { TestTypes } from "./entity/testTypes";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [TestTypes],
});
