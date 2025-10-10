import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./config";
import { EmailLog } from "./entity/EmailLog";
import { EmailTemplate } from "./entity/EmailTemplate";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: config.DATABASE_URL,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [EmailLog, EmailTemplate],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
