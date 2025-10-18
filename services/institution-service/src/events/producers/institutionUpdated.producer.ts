import logger from '../../config/logger';
import { USER_TOPICS } from '../../constants';

const { producer } = require('../kafka');

export const publishInstitutionUpdated = async (data: {
  key: string;
  value: {
    institutionId: number;
    type: 'clinic' | 'lab';
    institutionName: string;
    updatedFields: string[];
    updatedBy?: string;
    timestamp: string;
  };
}) => {
  const topic = USER_TOPICS.INSTITUTION_UPDATED;

  logger.info(`📤 Publishing institution updated event to topic: ${topic}`, {
    institutionId: data.value.institutionId,
    type: data.value.type,
  });

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: data.key,
          value: JSON.stringify(data.value),
        },
      ],
    });

    logger.info(
      `✅ Institution updated event published successfully to ${topic}`,
    );
  } catch (error) {
    logger.error(`❌ Failed to publish institution updated event:`, error);
    throw error;
  }
};
