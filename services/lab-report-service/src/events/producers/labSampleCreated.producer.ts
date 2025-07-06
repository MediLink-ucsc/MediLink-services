import { BaseProducer, KafkaMessage } from "@medilink/kafka-client";
import { producer } from "../kafka";
import { LAB_WORKFLOW_TOPICS } from "../../constants";
import { CreateLabSampleDto } from "../../dto/labSample.dto";

class LabSampleCreatedProducer extends BaseProducer<CreateLabSampleDto> {
  protected readonly topic = LAB_WORKFLOW_TOPICS.LAB_SAMPLE_CREATED;

  constructor() {
    super(producer);
  }
}

const labSampleCreatedProducer = new LabSampleCreatedProducer();

export const publishLabSampleCreated = async (
  data: KafkaMessage<CreateLabSampleDto>
): Promise<void> => labSampleCreatedProducer.publish(data);
