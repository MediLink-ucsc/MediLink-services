import { Request, Response } from "express";
import { EmailService } from "../services/email.service";
import { EmailType } from "../entity/EmailLog";
import { TemplateType } from "../entity/EmailTemplate";
import logger from "../config/logger";
import { z } from "zod";

// Validation schemas
const sendEmailSchema = z.object({
  to: z.string().email(),
  toName: z.string().optional(),
  subject: z.string().min(1),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  emailType: z.nativeEnum(EmailType).optional(),
  userId: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().uuid().safeParse(val).success,
      "Invalid UUID format"
    ),
  metadata: z.record(z.any()).optional(),
});

const sendTemplateEmailSchema = z.object({
  to: z.string().email(),
  toName: z.string().optional(),
  templateType: z.nativeEnum(TemplateType),
  templateParams: z.record(z.any()),
  userId: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().uuid().safeParse(val).success,
      "Invalid UUID format"
    ),
  metadata: z.record(z.any()).optional(),
});

const passwordResetSchema = z.object({
  email: z.string().email(),
  resetToken: z.string().min(1),
  userName: z.string().optional(),
});

const welcomeEmailSchema = z.object({
  email: z.string().email(),
  userName: z.string().min(1),
  verificationToken: z.string().optional(),
});

export class EmailController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = sendEmailSchema.parse(req.body);

      const emailLog = await this.emailService.sendEmail(validatedData);

      res.status(200).json({
        success: true,
        message: "Email sent successfully",
        data: {
          emailId: emailLog.id,
          status: emailLog.status,
          sentAt: emailLog.sentAt,
        },
      });
    } catch (error: any) {
      logger.error("Send email error:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: error.message,
      });
    }
  }

  async sendTemplateEmail(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = sendTemplateEmailSchema.parse(req.body);

      const emailLog = await this.emailService.sendTemplateEmail(validatedData);

      res.status(200).json({
        success: true,
        message: "Template email sent successfully",
        data: {
          emailId: emailLog.id,
          status: emailLog.status,
          sentAt: emailLog.sentAt,
        },
      });
    } catch (error: any) {
      logger.error("Send template email error:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to send template email",
        error: error.message,
      });
    }
  }

  async sendPasswordResetEmail(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = passwordResetSchema.parse(req.body);

      const emailLog = await this.emailService.sendPasswordResetEmail(
        validatedData.email,
        validatedData.resetToken,
        validatedData.userName
      );

      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
        data: {
          emailId: emailLog.id,
          status: emailLog.status,
        },
      });
    } catch (error: any) {
      logger.error("Send password reset email error:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
        error: error.message,
      });
    }
  }

  async sendWelcomeEmail(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = welcomeEmailSchema.parse(req.body);

      const emailLog = await this.emailService.sendWelcomeEmail(
        validatedData.email,
        validatedData.userName,
        validatedData.verificationToken
      );

      res.status(200).json({
        success: true,
        message: "Welcome email sent successfully",
        data: {
          emailId: emailLog.id,
          status: emailLog.status,
        },
      });
    } catch (error: any) {
      logger.error("Send welcome email error:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to send welcome email",
        error: error.message,
      });
    }
  }

  async getEmailHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId, limit = "50", offset = "0" } = req.query;

      const emails = await this.emailService.getEmailHistory(
        userId as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        success: true,
        data: emails,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: emails.length,
        },
      });
    } catch (error: any) {
      logger.error("Get email history error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve email history",
        error: error.message,
      });
    }
  }

  async retryEmail(req: Request, res: Response): Promise<void> {
    try {
      const { emailId } = req.params;

      if (!emailId) {
        res.status(400).json({
          success: false,
          message: "Email ID is required",
        });
        return;
      }

      const emailLog = await this.emailService.retryFailedEmail(emailId);

      res.status(200).json({
        success: true,
        message: "Email retry completed",
        data: {
          emailId: emailLog.id,
          status: emailLog.status,
          retryCount: emailLog.retryCount,
        },
      });
    } catch (error: any) {
      logger.error("Retry email error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retry email",
        error: error.message,
      });
    }
  }

  async getServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: "Notification service is running",
        data: {
          service: "notification-service",
          brevoConfigured: !!process.env.BREVO_API_KEY,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error("Get service status error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to get service status",
        error: error.message,
      });
    }
  }
}
