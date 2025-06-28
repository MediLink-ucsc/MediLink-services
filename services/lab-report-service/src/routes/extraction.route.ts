import express from "express";
import extractionController from "../controllers/extractionController";
import upload from "../middleware/upload";

const extractionRouter = express.Router();

// Route to handle extraction requests with file upload
extractionRouter.post(
  "/extract",
  upload.single("file"),
  extractionController.extractData
);

export { extractionRouter };
