import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { EmailTemplate, TemplateType } from "../entity/EmailTemplate";
import logger from "../config/logger";

export interface CreateTemplateRequest {
  templateType: TemplateType;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables?: Record<string, string>;
  description?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  variables?: Record<string, string>;
  description?: string;
  isActive?: boolean;
}

export class EmailTemplateService {
  private templateRepository: Repository<EmailTemplate>;

  constructor() {
    this.templateRepository = AppDataSource.getRepository(EmailTemplate);
  }

  async createTemplate(request: CreateTemplateRequest): Promise<EmailTemplate> {
    // Check if template type already exists
    const existingTemplate = await this.templateRepository.findOne({
      where: { templateType: request.templateType },
    });

    if (existingTemplate) {
      throw new Error(
        `Template for type ${request.templateType} already exists`
      );
    }

    const template = this.templateRepository.create(request);
    await this.templateRepository.save(template);

    logger.info(`Created email template: ${template.name}`);
    return template;
  }

  async updateTemplate(
    templateType: TemplateType,
    request: UpdateTemplateRequest
  ): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({
      where: { templateType },
    });

    if (!template) {
      throw new Error(`Template for type ${templateType} not found`);
    }

    // Update template fields
    Object.assign(template, request);
    await this.templateRepository.save(template);

    logger.info(`Updated email template: ${template.name}`);
    return template;
  }

  async getTemplate(templateType: TemplateType): Promise<EmailTemplate | null> {
    return this.templateRepository.findOne({
      where: { templateType, isActive: true },
    });
  }

  async getAllTemplates(
    includeInactive: boolean = false
  ): Promise<EmailTemplate[]> {
    const query = this.templateRepository.createQueryBuilder("template");

    if (!includeInactive) {
      query.where("template.isActive = :isActive", { isActive: true });
    }

    return query.orderBy("template.templateType", "ASC").getMany();
  }

  async deleteTemplate(templateType: TemplateType): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: { templateType },
    });

    if (!template) {
      throw new Error(`Template for type ${templateType} not found`);
    }

    await this.templateRepository.remove(template);
    logger.info(`Deleted email template: ${template.name}`);
  }

  async deactivateTemplate(templateType: TemplateType): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({
      where: { templateType },
    });

    if (!template) {
      throw new Error(`Template for type ${templateType} not found`);
    }

    template.isActive = false;
    await this.templateRepository.save(template);

    logger.info(`Deactivated email template: ${template.name}`);
    return template;
  }

  async activateTemplate(templateType: TemplateType): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({
      where: { templateType },
    });

    if (!template) {
      throw new Error(`Template for type ${templateType} not found`);
    }

    template.isActive = true;
    await this.templateRepository.save(template);

    logger.info(`Activated email template: ${template.name}`);
    return template;
  }

  async previewTemplate(
    templateType: TemplateType,
    variables: Record<string, any>
  ): Promise<{ subject: string; htmlContent: string; textContent?: string }> {
    const template = await this.getTemplate(templateType);

    if (!template) {
      throw new Error(`Template for type ${templateType} not found`);
    }

    const subject = this.replaceVariables(template.subject, variables);
    const htmlContent = this.replaceVariables(template.htmlTemplate, variables);
    const textContent = template.textTemplate
      ? this.replaceVariables(template.textTemplate, variables)
      : undefined;

    return { subject, htmlContent, textContent };
  }

  private replaceVariables(
    template: string,
    variables: Record<string, any>
  ): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, String(value));
    });

    return result;
  }
}
