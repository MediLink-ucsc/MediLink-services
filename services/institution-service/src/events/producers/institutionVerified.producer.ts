import logger from '../../config/logger';
import { USER_TOPICS } from '../../constants';

const { producer } = require('../kafka');

export const publishInstitutionVerified = async (data: {
  key: string;
  value: {
    institutionId: number;
    type: 'clinic' | 'lab';
    institutionName: string;
    status: string;
    verifiedBy?: string;
    timestamp: string;
  };
}) => {
  const topic = USER_TOPICS.INSTITUTION_VERIFIED;

  logger.info(`📤 Publishing institution verified event to topic: ${topic}`, {
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
      `✅ Institution verified event published successfully to ${topic}`,
    );
  } catch (error) {
    logger.error(`❌ Failed to publish institution verified event:`, error);
    throw error;
  }
};
