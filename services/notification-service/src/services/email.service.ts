import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { EmailLog, EmailStatus, EmailType } from "../entity/EmailLog";
import { EmailTemplate, TemplateType } from "../entity/EmailTemplate";
import { BrevoService, EmailData } from "./brevo.service";
import logger from "../config/logger";

export interface SendEmailRequest {
  to: string;
  toName?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  emailType?: EmailType;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface SendTemplateEmailRequest {
  to: string;
  toName?: string;
  templateType: TemplateType;
  templateParams: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}

export class EmailService {
  private emailLogRepository: Repository<EmailLog>;
  private emailTemplateRepository: Repository<EmailTemplate>;
  private brevoService: BrevoService;

  constructor() {
    this.emailLogRepository = AppDataSource.getRepository(EmailLog);
    this.emailTemplateRepository = AppDataSource.getRepository(EmailTemplate);
    this.brevoService = new BrevoService();
  }

  async sendEmail(request: SendEmailRequest): Promise<EmailLog> {
    // Create email log entry
    const emailLog = this.emailLogRepository.create({
      recipientEmail: request.to,
      recipientName: request.toName,
      senderEmail: process.env.BREVO_SENDER_EMAIL || "",
      senderName: process.env.BREVO_SENDER_NAME || "",
      subject: request.subject,
      htmlContent: request.htmlContent || "",
      textContent: request.textContent,
      emailType: request.emailType || EmailType.GENERAL,
      status: EmailStatus.PENDING,
      userId: request.userId,
      metadata: request.metadata,
    });

    await this.emailLogRepository.save(emailLog);

    try {
      // Send email via Brevo
      const brevoResponse = await this.brevoService.sendEmail({
        to: request.to,
        toName: request.toName,
        subject: request.subject,
        htmlContent: request.htmlContent || "",
        textContent: request.textContent,
      });

      // Update email log with result
      emailLog.status = brevoResponse.success
        ? EmailStatus.SENT
        : EmailStatus.FAILED;
      emailLog.brevoMessageId = brevoResponse.messageId;
      emailLog.errorMessage = brevoResponse.error;

      if (brevoResponse.success) {
        emailLog.sentAt = new Date();
      }

      await this.emailLogRepository.save(emailLog);

      logger.info(`Email ${brevoResponse.success ? "sent" : "failed"}`, {
        emailId: emailLog.id,
        recipient: request.to,
        messageId: brevoResponse.messageId,
      });

      return emailLog;
    } catch (error: any) {
      // Update email log with error
      emailLog.status = EmailStatus.FAILED;
      emailLog.errorMessage = error.message;
      await this.emailLogRepository.save(emailLog);

      logger.error("Email sending failed:", {
        emailId: emailLog.id,
        error: error.message,
        recipient: request.to,
      });

      throw error;
    }
  }

  async sendTemplateEmail(
    request: SendTemplateEmailRequest
  ): Promise<EmailLog> {
    // Get template
    const template = await this.emailTemplateRepository.findOne({
      where: { templateType: request.templateType, isActive: true },
    });

    if (!template) {
      throw new Error(`Template not found for type: ${request.templateType}`);
    }

    // Replace template variables
    const subject = this.replaceTemplateVariables(
      template.subject,
      request.templateParams
    );
    const htmlContent = this.replaceTemplateVariables(
      template.htmlTemplate,
      request.templateParams
    );
    const textContent = template.textTemplate
      ? this.replaceTemplateVariables(
          template.textTemplate,
          request.templateParams
        )
      : undefined;

    // Send email using the regular sendEmail method
    return this.sendEmail({
      to: request.to,
      toName: request.toName,
      subject,
      htmlContent,
      textContent,
      emailType: this.mapTemplateTypeToEmailType(request.templateType),
      userId: request.userId,
      metadata: {
        ...request.metadata,
        templateType: request.templateType,
        templateId: template.id,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<EmailLog> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return this.sendTemplateEmail({
      to: email,
      toName: userName,
      templateType: TemplateType.PASSWORD_RESET,
      templateParams: {
        userName: userName || email,
        resetUrl,
        expiryTime: process.env.PASSWORD_RESET_EXPIRY || "15 minutes",
      },
    });
  }

  async sendWelcomeEmail(
    email: string,
    userName: string,
    verificationToken?: string
  ): Promise<EmailLog> {
    const verificationUrl = verificationToken
      ? `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
      : undefined;

    return this.sendTemplateEmail({
      to: email,
      toName: userName,
      templateType: TemplateType.WELCOME,
      templateParams: {
        userName,
        verificationUrl,
        supportEmail: process.env.BREVO_SENDER_EMAIL,
      },
    });
  }

  async sendWelcomeEmailWithPassword(
    email: string,
    userName: string,
    temporaryPassword: string,
    userRole: string
  ): Promise<EmailLog> {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    return this.sendTemplateEmail({
      to: email,
      toName: userName,
      templateType: TemplateType.WELCOME_WITH_PASSWORD,
      templateParams: {
        userName,
        temporaryPassword,
        userRole,
        loginUrl,
        supportEmail: process.env.BREVO_SENDER_EMAIL,
      },
    });
  }

  async getEmailHistory(
    userId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<EmailLog[]> {
    const query = this.emailLogRepository
      .createQueryBuilder("email")
      .orderBy("email.createdAt", "DESC")
      .limit(limit)
      .offset(offset);

    if (userId) {
      query.where("email.userId = :userId", { userId });
    }

    return query.getMany();
  }

  async retryFailedEmail(emailId: string): Promise<EmailLog> {
    const emailLog = await this.emailLogRepository.findOne({
      where: { id: emailId },
    });

    if (!emailLog) {
      throw new Error("Email log not found");
    }

    if (emailLog.status !== EmailStatus.FAILED) {
      throw new Error("Only failed emails can be retried");
    }

    if (emailLog.retryCount >= 3) {
      throw new Error("Maximum retry attempts reached");
    }

    // Increment retry count
    emailLog.retryCount += 1;
    emailLog.status = EmailStatus.PENDING;
    emailLog.errorMessage = undefined;
    await this.emailLogRepository.save(emailLog);

    // Retry sending
    try {
      const brevoResponse = await this.brevoService.sendEmail({
        to: emailLog.recipientEmail,
        toName: emailLog.recipientName,
        subject: emailLog.subject,
        htmlContent: emailLog.htmlContent,
        textContent: emailLog.textContent,
      });

      emailLog.status = brevoResponse.success
        ? EmailStatus.SENT
        : EmailStatus.FAILED;
      emailLog.brevoMessageId = brevoResponse.messageId;
      emailLog.errorMessage = brevoResponse.error;

      if (brevoResponse.success) {
        emailLog.sentAt = new Date();
      }

      await this.emailLogRepository.save(emailLog);
      return emailLog;
    } catch (error: any) {
      emailLog.status = EmailStatus.FAILED;
      emailLog.errorMessage = error.message;
      await this.emailLogRepository.save(emailLog);
      throw error;
    }
  }

  private replaceTemplateVariables(
    template: string,
    params: Record<string, any>
  ): string {
    let result = template;

    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, String(value));
    });

    return result;
  }

  private mapTemplateTypeToEmailType(templateType: TemplateType): EmailType {
    const mapping: Record<TemplateType, EmailType> = {
      [TemplateType.PASSWORD_RESET]: EmailType.PASSWORD_RESET,
      [TemplateType.USER_ONBOARDING]: EmailType.USER_ONBOARDING,
      [TemplateType.WELCOME]: EmailType.WELCOME,
      [TemplateType.WELCOME_WITH_PASSWORD]: EmailType.WELCOME_WITH_PASSWORD,
      [TemplateType.EMAIL_VERIFICATION]: EmailType.EMAIL_VERIFICATION,
      [TemplateType.LAB_REPORT]: EmailType.LAB_REPORT,
      [TemplateType.CLINIC_VISIT]: EmailType.CLINIC_VISIT,
      [TemplateType.APPOINTMENT_REMINDER]: EmailType.APPOINTMENT_REMINDER,
    };

    return mapping[templateType] || EmailType.GENERAL;
  }
}
