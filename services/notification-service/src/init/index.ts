import { initEmailTemplates } from "./email-templates";
import logger from "../config/logger";

const init = async (): Promise<void> => {
  try {
    logger.info("Starting notification service initialization...");

    // Initialize email templates
    await initEmailTemplates();

    logger.info("Notification service initialization completed successfully");
  } catch (error) {
    logger.error("Notification service initialization failed:", error);
    throw error;
  }
};

export default init;
