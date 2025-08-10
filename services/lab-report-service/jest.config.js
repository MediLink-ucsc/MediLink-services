module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [
    "**/tests/integration/**/*e2e.test.ts",
    "**/tests/integration/*.*.test.ts",
  ],
  moduleFileExtensions: ["ts", "js", "json"],
  // setupFiles run BEFORE the test framework is installed & before any imports in tests
  setupFiles: ["<rootDir>/tests/jest-env.ts"],
  // setupFilesAfterEnv run AFTER the environment is set up
  setupFilesAfterEnv: ["<rootDir>/tests/test-setup.ts"],
  verbose: true,
  testTimeout: 30000,
};
