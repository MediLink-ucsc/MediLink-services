import "reflect-metadata";
import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

// Mock external services for testing
jest.mock("../src/services/brevo.service");
jest.mock("../src/events/kafka.service");

// Set test environment
process.env.NODE_ENV = "test";
