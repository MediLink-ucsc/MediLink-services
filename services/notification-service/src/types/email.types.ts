// Email types and interfaces
export interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  templateParams?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TemplateEmailPayload {
  to: string;
  toName?: string;
  templateType: string;
  templateParams: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  emailId?: string;
  messageId?: string;
  error?: string;
}

export interface EmailStatus {
  emailId: string;
  status: "pending" | "sent" | "failed" | "delivered" | "bounced" | "spam";
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
}

// Kafka event types
export interface EmailSentEvent {
  emailId: string;
  recipientEmail: string;
  emailType: string;
  sentAt: Date;
  messageId?: string;
}

export interface EmailFailedEvent {
  emailId: string;
  recipientEmail: string;
  emailType: string;
  error: string;
  failedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
}
