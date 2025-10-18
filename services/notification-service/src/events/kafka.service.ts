import { Kafka, Producer, Consumer } from "kafkajs";
import { config } from "../config";
import logger from "../config/logger";

class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.SERVICE_NAME,
      brokers: [config.KAFKA_BROKER],
    });
  }

  async initProducer(): Promise<void> {
    try {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      logger.info("Kafka producer connected");
    } catch (error) {
      logger.error("Failed to connect Kafka producer:", error);
      throw error;
    }
  }

  async initConsumer(groupId: string): Promise<void> {
    try {
      this.consumer = this.kafka.consumer({ groupId });
      await this.consumer.connect();
      logger.info("Kafka consumer connected");
    } catch (error) {
      logger.error("Failed to connect Kafka consumer:", error);
      throw error;
    }
  }

  async publishEvent(topic: string, message: any): Promise<void> {
    if (!this.producer) {
      throw new Error("Kafka producer is not initialized");
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      logger.info(`Event published to topic ${topic}:`, message);
    } catch (error) {
      logger.error(`Failed to publish event to topic ${topic}:`, error);
      throw error;
    }
  }

  async subscribeToTopic(
    topic: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.consumer) {
      throw new Error("Kafka consumer is not initialized");
    }

    try {
      await this.consumer.subscribe({ topic });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageValue = message.value?.toString();
            if (messageValue) {
              const parsedMessage = JSON.parse(messageValue);
              await handler(parsedMessage);
              logger.info(
                `Processed message from topic ${topic}:`,
                parsedMessage
              );
            }
          } catch (error) {
            logger.error(
              `Error processing message from topic ${topic}:`,
              error
            );
          }
        },
      });

      logger.info(`Subscribed to topic: ${topic}`);
    } catch (error) {
      logger.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        logger.info("Kafka producer disconnected");
      }

      if (this.consumer) {
        await this.consumer.disconnect();
        logger.info("Kafka consumer disconnected");
      }
    } catch (error) {
      logger.error("Error disconnecting Kafka:", error);
    }
  }
}

export default new KafkaService();
