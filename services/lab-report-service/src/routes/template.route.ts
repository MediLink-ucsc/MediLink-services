import { Router } from "express";
import templateController from "../controllers/template.controller";

const router = Router();

// Test Type Management Routes
router.post("/test-types", templateController.createTestType);
router.get("/test-types", templateController.getTestTypes);
router.get("/test-types/:id", templateController.getTestTypeById);
router.put("/test-types/:id", templateController.updateTestType);

// Template Management Routes
router.post("/templates", templateController.createReportTemplate);
router.get("/templates/:testTypeId", templateController.getReportTemplate);

// Utility Routes
router.get("/parsers", templateController.getAvailableParsers);
router.get("/field-types", templateController.getFieldTypes);
router.get("/categories", templateController.getCategories);

export default router;
