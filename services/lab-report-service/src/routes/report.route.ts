import express from "express";
import { ReportHandlerController } from "../controllers/reportHandler.controller";
import { reportHandlerService } from "../services/reportHandler.service";

const reportRouter = express.Router();
const reportController = new ReportHandlerController(reportHandlerService);

reportRouter.post(
  "/addTestType",
  reportController.addTestType.bind(reportController)
);

reportRouter.get(
  "/testTypes",
  reportController.getTestTypes.bind(reportController)
);

reportRouter.get(
  "/testType/:id",
  reportController.getTestTypeById.bind(reportController)
);

export { reportRouter };
