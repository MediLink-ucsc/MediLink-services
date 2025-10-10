import {
  TransactionalEmailsApi,
  SendSmtpEmail,
  AccountApi,
} from "@getbrevo/brevo";
import { config } from "../config";
import logger from "../config/logger";

export interface EmailData {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: number;
  templateParams?: Record<string, any>;
}

export interface BrevoResponse {
  messageId: string;
  success: boolean;
  error?: string;
}

export class BrevoService {
  private apiInstance: TransactionalEmailsApi;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeBrevo();
  }

  private initializeBrevo(): void {
    try {
      if (!config.BREVO_API_KEY) {
        logger.error("Brevo API key is not configured");
        this.isConfigured = false;
        return;
      }

      this.apiInstance = new TransactionalEmailsApi();
      this.apiInstance.setApiKey(0, config.BREVO_API_KEY);
      this.isConfigured = true;

      logger.info("Brevo service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Brevo service:", error);
      this.isConfigured = false;
    }
  }

  async sendEmail(emailData: EmailData): Promise<BrevoResponse> {
    if (!this.isConfigured) {
      const error = "Brevo service is not properly configured";
      logger.error(error);
      return { messageId: "", success: false, error };
    }

    try {
      const sendSmtpEmail = new SendSmtpEmail();

      // Set sender
      sendSmtpEmail.sender = {
        email: config.BREVO_SENDER_EMAIL,
        name: config.BREVO_SENDER_NAME,
      };

      // Set recipient
      sendSmtpEmail.to = [
        {
          email: emailData.to,
          name: emailData.toName || emailData.to,
        },
      ];

      // Set content
      sendSmtpEmail.subject = emailData.subject;
      sendSmtpEmail.htmlContent = emailData.htmlContent;

      if (emailData.textContent) {
        sendSmtpEmail.textContent = emailData.textContent;
      }

      // If using template
      if (emailData.templateId) {
        sendSmtpEmail.templateId = emailData.templateId;
        if (emailData.templateParams) {
          sendSmtpEmail.params = emailData.templateParams;
        }
      }

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      // Extract messageId from response body
      const messageId = response.body?.messageId || "";

      logger.info(`Email sent successfully to ${emailData.to}`, {
        messageId: messageId,
        recipient: emailData.to,
      });

      return {
        messageId: messageId,
        success: true,
      };
    } catch (error: any) {
      logger.error("Failed to send email via Brevo:", {
        error: error.message,
        recipient: emailData.to,
        subject: emailData.subject,
      });

      return {
        messageId: "",
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  }

  async sendTemplateEmail(
    to: string,
    templateId: number,
    templateParams: Record<string, any>,
    toName?: string
  ): Promise<BrevoResponse> {
    return this.sendEmail({
      to,
      toName,
      subject: "", // Subject will come from template
      htmlContent: "", // Content will come from template
      templateId,
      templateParams,
    });
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  async getAccount(): Promise<any> {
    if (!this.isConfigured) {
      throw new Error("Brevo service is not properly configured");
    }

    try {
      const accountApi = new AccountApi();
      accountApi.setApiKey(0, config.BREVO_API_KEY);
      const account = await accountApi.getAccount();
      return account;
    } catch (error) {
      logger.error("Failed to get Brevo account info:", error);
      throw error;
    }
  }
}
