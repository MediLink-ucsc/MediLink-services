import { Router } from "express";
import { EmailController } from "../controllers/email.controller";

const router = Router();
const emailController = new EmailController();

// Health check
router.get("/", emailController.getServiceStatus.bind(emailController));

export { router as indexRouter };
