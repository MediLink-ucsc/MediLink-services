import { DataSourceOptions } from "typeorm";
import { config } from "./config";
import { ActivityEvent } from "./entity/ActivityEvent";

export const typeOrmConfig: DataSourceOptions = {
  type: "postgres",
  url: config.DATABASE_URL,
  synchronize: true, // Set to false in production
  logging: process.env.NODE_ENV === "development",
  entities: [ActivityEvent],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
};
