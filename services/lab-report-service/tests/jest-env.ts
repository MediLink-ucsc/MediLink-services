// Early Jest setup to ensure critical environment variables exist BEFORE modules load
// Must only use plain JS (no TS transpile dependencies loaded yet if ts-jest not initialized fully)

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.SKIP_LISTEN = "true";
// Use in-memory sqlite for tests unless explicitly disabled
// Always Postgres now; no sqlite fallback
// 64 hex chars -> 32 bytes
process.env.LAB_DATA_ENCRYPTION_KEY =
  process.env.LAB_DATA_ENCRYPTION_KEY ||
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgres://admin:medilink@localhost:5432/lab_report_test";
