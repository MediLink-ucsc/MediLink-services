import logger from '../../config/logger';
import { PATIENT_RECORD_SUBSCRIBE_TOPICS } from '../../constants';

const { producer } = require('../kafka');

export const publishLabOrderCreated = async (data: any) => {
  const topic = PATIENT_RECORD_SUBSCRIBE_TOPICS.LAB_ORDER_CREATED;

  logger.info(
    `Publishing message to topic: ${topic} with message: ${JSON.stringify(data)}`
  );

  await producer.send({
    topic,
    messages: [
      {
        key: data.key,
        value: JSON.stringify(data.value),
      },
    ],
  });
};
