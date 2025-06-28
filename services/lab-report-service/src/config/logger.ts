import { config } from ".";
import { getLogger } from "@medilink/logger";

const logger = getLogger(config.SERVICE_NAME, config.LOG_LEVEL);

export default logger;
