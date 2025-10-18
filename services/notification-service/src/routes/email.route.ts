import { Router } from "express";
import { EmailController } from "../controllers/email.controller";

const router = Router();
const emailController = new EmailController();

// Send emails
router.post("/send", emailController.sendEmail.bind(emailController));
router.post(
  "/send-template",
  emailController.sendTemplateEmail.bind(emailController)
);

// Specific email types
router.post(
  "/password-reset",
  emailController.sendPasswordResetEmail.bind(emailController)
);
router.post("/welcome", emailController.sendWelcomeEmail.bind(emailController));
router.post(
  "/welcome-with-password",
  emailController.sendWelcomeEmailWithPassword.bind(emailController)
);

// Email management
router.get("/history", emailController.getEmailHistory.bind(emailController));
router.post(
  "/retry/:emailId",
  emailController.retryEmail.bind(emailController)
);

export { router as emailRouter };
