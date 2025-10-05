import KafkaClient from "@medilink/kafka-client";
import { config } from "../config";
import logger from "../config/logger";
import { ACTIVITY_TOPICS } from "../constants";
import { EventProcessor } from "../processors/EventProcessor";
import { KafkaEventData } from "../types";

export class KafkaConsumerService {
  private kafkaClient: KafkaClient;
  private eventProcessor: EventProcessor;
  private consumers: Map<string, any> = new Map();

  constructor() {
    this.kafkaClient = new KafkaClient(config.SERVICE_NAME, [
      config.KAFKA_BROKER,
    ]);
    this.eventProcessor = new EventProcessor();
  }

  async startConsumers(): Promise<void> {
    try {
      await this.kafkaClient.connect();

      // Get all topics to subscribe to
      const topics = Object.values(ACTIVITY_TOPICS);

      // Create consumer for activity timeline
      const consumer = this.kafkaClient.createConsumer(config.KAFKA_GROUP_ID);

      await consumer.connect();
      await consumer.subscribe({ topics, fromBeginning: true });

      logger.info(`Subscribed to topics: ${topics.join(", ")}`);

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) {
              logger.warn("Received message with no value", {
                topic,
                partition,
              });
              return;
            }

            const eventData: KafkaEventData = {
              key: message.key?.toString() || "",
              value: JSON.parse(message.value.toString()),
              topic,
              partition,
              offset: message.offset,
              timestamp: message.timestamp || Date.now().toString(),
            };

            await this.eventProcessor.processEvent(eventData);
          } catch (error) {
            logger.error("Error processing message:", error, {
              topic,
              partition,
              offset: message.offset,
            });
          }
        },
      });

      this.consumers.set("activity-timeline-consumer", consumer);
      logger.info("Activity timeline Kafka consumer started successfully");
    } catch (error) {
      logger.error("Failed to start Kafka consumers:", error);
      throw error;
    }
  }

  async stopConsumers(): Promise<void> {
    try {
      for (const [name, consumer] of this.consumers) {
        await consumer.disconnect();
        logger.info(`Consumer ${name} disconnected`);
      }

      await this.kafkaClient.disconnect();
      this.consumers.clear();

      logger.info("All Kafka consumers stopped");
    } catch (error) {
      logger.error("Error stopping Kafka consumers:", error);
    }
  }
}
