import { AppDataSource } from "../data-source";
import { EmailTemplate, TemplateType } from "../entity/EmailTemplate";
import logger from "../config/logger";

export const initEmailTemplates = async (): Promise<void> => {
  try {
    const templateRepository = AppDataSource.getRepository(EmailTemplate);

    // Default email templates
    const defaultTemplates = [
      {
        templateType: TemplateType.PASSWORD_RESET,
        name: "Password Reset",
        subject: "Reset Your MediLink Password",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello {{userName}},</p>
            <p>We received a request to reset your password for your MediLink account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>This link will expire in {{expiryTime}}.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              MediLink Support Team<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
        textTemplate: `
          Password Reset Request
          
          Hello {{userName}},
          
          We received a request to reset your password for your MediLink account.
          
          Please visit the following link to reset your password:
          {{resetUrl}}
          
          This link will expire in {{expiryTime}}.
          
          If you didn't request this password reset, please ignore this email.
          
          --
          MediLink Support Team
        `,
        variables: {
          userName: "User name",
          resetUrl: "Password reset URL",
          expiryTime: "Token expiry time",
        },
        description: "Template for password reset emails",
      },
      {
        templateType: TemplateType.WELCOME,
        name: "Welcome Email",
        subject: "Welcome to MediLink",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to MediLink!</h2>
            <p>Hello {{userName}},</p>
            <p>Welcome to MediLink! We're excited to have you on board.</p>
            <p>MediLink is your comprehensive healthcare management platform where you can:</p>
            <ul>
              <li>Access your medical records</li>
              <li>View lab reports</li>
              <li>Schedule appointments</li>
              <li>Communicate with healthcare providers</li>
            </ul>
            {{#if verificationUrl}}
            <p>To get started, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationUrl}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            {{/if}}
            <p>If you have any questions, feel free to contact our support team at {{supportEmail}}.</p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              MediLink Support Team<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
        textTemplate: `
          Welcome to MediLink!
          
          Hello {{userName}},
          
          Welcome to MediLink! We're excited to have you on board.
          
          MediLink is your comprehensive healthcare management platform where you can:
          - Access your medical records
          - View lab reports
          - Schedule appointments
          - Communicate with healthcare providers
          
          {{#if verificationUrl}}
          To get started, please verify your email address by visiting:
          {{verificationUrl}}
          {{/if}}
          
          If you have any questions, feel free to contact our support team at {{supportEmail}}.
          
          --
          MediLink Support Team
        `,
        variables: {
          userName: "User name",
          verificationUrl: "Email verification URL (optional)",
          supportEmail: "Support email address",
        },
        description: "Welcome email for new users",
      },
      {
        templateType: TemplateType.WELCOME_WITH_PASSWORD,
        name: "Welcome Email with Password",
        subject: "Welcome to MediLink - Your Account Details",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to MediLink!</h2>
            <p>Hello {{userName}},</p>
            <p>Your account has been created by your administrator. Welcome to the MediLink healthcare management platform as a <strong>{{userRole}}</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Login Credentials</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> Your registered email address</p>
              <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 5px 10px; border-radius: 4px; font-size: 16px;">{{temporaryPassword}}</code></p>
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Important Security Notice:</strong></p>
              <p style="margin: 10px 0 0 0;">For your security, please change this temporary password immediately after your first login.</p>
            </div>

            <p>To get started:</p>
            <ol>
              <li>Click the login button below</li>
              <li>Use your email and the temporary password provided above</li>
              <li>You will be prompted to change your password</li>
              <li>Set a strong, unique password for your account</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Login to MediLink</a>
            </div>

            <p>As a {{userRole}}, you will have access to:</p>
            <ul>
              <li>Patient management and records</li>
              <li>Healthcare service tools</li>
              <li>Communication with your team</li>
              <li>And much more...</li>
            </ul>

            <p>If you have any questions or need assistance, please contact our support team at {{supportEmail}}.</p>
            
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              MediLink Support Team<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
        textTemplate: `
          Welcome to MediLink!
          
          Hello {{userName}},
          
          Your account has been created by your administrator. Welcome to the MediLink healthcare management platform as a {{userRole}}.
          
          YOUR LOGIN CREDENTIALS
          =======================
          Email: Your registered email address
          Temporary Password: {{temporaryPassword}}
          
          ⚠️ IMPORTANT SECURITY NOTICE
          For your security, please change this temporary password immediately after your first login.
          
          TO GET STARTED:
          1. Visit the login page: {{loginUrl}}
          2. Use your email and the temporary password provided above
          3. You will be prompted to change your password
          4. Set a strong, unique password for your account
          
          As a {{userRole}}, you will have access to:
          - Patient management and records
          - Healthcare service tools
          - Communication with your team
          - And much more...
          
          If you have any questions or need assistance, please contact our support team at {{supportEmail}}.
          
          --
          MediLink Support Team
        `,
        variables: {
          userName: "User name",
          temporaryPassword: "Temporary password for first login",
          userRole: "User role (Doctor, Lab Assistant, Medical Staff)",
          loginUrl: "Login page URL",
          supportEmail: "Support email address",
        },
        description:
          "Welcome email with temporary password for admin-created accounts",
      },
      {
        templateType: TemplateType.EMAIL_VERIFICATION,
        name: "Email Verification",
        subject: "Verify Your Email Address",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify Your Email Address</h2>
            <p>Hello {{userName}},</p>
            <p>Please verify your email address to complete your MediLink registration.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationUrl}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p>This link will expire in 24 hours.</p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              MediLink Support Team<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
        variables: {
          userName: "User name",
          verificationUrl: "Email verification URL",
        },
        description: "Email verification template",
      },
    ];

    // Insert templates if they don't exist
    for (const templateData of defaultTemplates) {
      const existingTemplate = await templateRepository.findOne({
        where: { templateType: templateData.templateType },
      });

      if (!existingTemplate) {
        const template = templateRepository.create(templateData);
        await templateRepository.save(template);
        logger.info(`Created email template: ${templateData.name}`);
      }
    }

    logger.info("Email templates initialization completed");
  } catch (error) {
    logger.error("Failed to initialize email templates:", error);
    throw error;
  }
};
