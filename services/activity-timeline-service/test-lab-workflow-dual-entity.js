const { Kafka } = require("kafkajs");

const kafka = Kafka({
  clientId: "lab-workflow-test-producer",
  brokers: ["localhost:9094"],
});

const producer = kafka.producer();

async function testLabWorkflowDualEntity() {
  await producer.connect();
  console.log("🔗 Connected to Kafka");

  // Test LAB_SAMPLE_CREATED - should create both patient and lab activities
  const sampleCreatedEvent = {
    sampleId: "SAMPLE_12345",
    patientId: "PATIENT_123",
    labId: "LAB_456", // This should trigger lab entity activity creation
    sampleType: "Blood",
    labOrderId: "ORDER_789",
    status: "collected",
    timestamp: new Date().toISOString(),
  };

  console.log("🧪 Sending LAB_SAMPLE_CREATED event:", sampleCreatedEvent);
  await producer.send({
    topic: "LAB_SAMPLE_CREATED",
    messages: [
      {
        key: sampleCreatedEvent.sampleId,
        value: JSON.stringify(sampleCreatedEvent),
        timestamp: Date.now().toString(),
      },
    ],
  });

  // Wait a moment for processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test LAB_RESULT_PROCESSED - should create both patient and lab activities
  const resultProcessedEvent = {
    resultId: "RESULT_67890",
    sampleId: "SAMPLE_12345",
    patientId: "PATIENT_123",
    labId: "LAB_456", // This should trigger lab entity activity creation
    testType: "Complete Blood Count",
    status: "completed",
    timestamp: new Date().toISOString(),
  };

  console.log("📊 Sending LAB_RESULT_PROCESSED event:", resultProcessedEvent);
  await producer.send({
    topic: "LAB_RESULT_PROCESSED",
    messages: [
      {
        key: resultProcessedEvent.resultId,
        value: JSON.stringify(resultProcessedEvent),
        timestamp: Date.now().toString(),
      },
    ],
  });

  // Wait a moment for processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test without labId - should only create patient activity
  const sampleWithoutLabId = {
    sampleId: "SAMPLE_99999",
    patientId: "PATIENT_999",
    // no labId - should only create patient activity
    sampleType: "Urine",
    labOrderId: "ORDER_999",
    status: "collected",
    timestamp: new Date().toISOString(),
  };

  console.log(
    "🔬 Sending LAB_SAMPLE_CREATED without labId:",
    sampleWithoutLabId
  );
  await producer.send({
    topic: "LAB_SAMPLE_CREATED",
    messages: [
      {
        key: sampleWithoutLabId.sampleId,
        value: JSON.stringify(sampleWithoutLabId),
        timestamp: Date.now().toString(),
      },
    ],
  });

  console.log(
    "✅ All test events sent! Check the activity timeline service logs and database."
  );

  await producer.disconnect();
}

testLabWorkflowDualEntity().catch(console.error);
