import axios from 'axios';
import { config } from '../config';
import logger from '../config/logger';

export interface EmailRequest {
  to: string;
  toName?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  emailType?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PasswordResetEmailRequest {
  email: string;
  resetToken: string;
  userName?: string;
}

export interface WelcomeEmailRequest {
  email: string;
  userName: string;
  verificationToken?: string;
}

export class NotificationServiceClient {
  private baseURL: string;

  constructor() {
    this.baseURL = config.NOTIFICATION_SERVICE_URL;
  }

  async sendEmail(emailRequest: EmailRequest): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/email/send`,
        emailRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        },
      );

      logger.info('Email sent successfully via notification service', {
        recipient: emailRequest.to,
        emailType: emailRequest.emailType,
        emailId: (response.data as any)?.data?.emailId,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to send email via notification service:', {
        error: error.message,
        recipient: emailRequest.to,
        emailType: emailRequest.emailType,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      // Re-throw with more context
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(
    request: PasswordResetEmailRequest,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/email/password-reset`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      logger.info('Password reset email sent successfully', {
        recipient: request.email,
        emailId: (response.data as any)?.data?.emailId,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to send password reset email:', {
        error: error.message,
        recipient: request.email,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(request: WelcomeEmailRequest): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/email/welcome`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      logger.info('Welcome email sent successfully', {
        recipient: request.email,
        emailId: (response.data as any)?.data?.emailId,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to send welcome email:', {
        error: error.message,
        recipient: request.email,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  async getServiceHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/`, {
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      logger.error('Notification service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationServiceClient();
