import "reflect-metadata";
import { AppDataSource } from "../src/data-source";
import { Client } from "pg";
import pythonService from "../src/services/python.service";

// (Early env vars handled in tests/jest-env.ts) -- keep this lean

beforeAll(async () => {
  // Ensure test database exists (parse from DATABASE_URL)
  const dbUrl = process.env.DATABASE_URL!;
  try {
    const url = new URL(dbUrl);
    const dbName = url.pathname.replace(/^\//, "");
    // Connect to default postgres db to create test db if needed
    const adminUrl = `${url.protocol}//${url.username}:${url.password}@${
      url.hostname
    }:${url.port || 5432}/postgres`;
    const adminClient = new Client({ connectionString: adminUrl });
    await adminClient.connect();
    const existsRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    if (existsRes.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
    }
    await adminClient.end();
  } catch (e) {
    console.warn("Test DB auto-create skipped or failed:", e);
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  // Mock python extraction to avoid requiring Python in CI
  // @ts-ignore
  pythonService.extractData = jest
    .fn()
    .mockResolvedValue({ mocked: true, result: { value: 42 } });
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
