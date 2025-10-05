import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "test-producer",
  brokers: ["localhost:9094"],
});

const producer = kafka.producer();

const generateTestEvents = async () => {
  await producer.connect();
  console.log("Test producer connected to Kafka");

  // Test user registration event
  await producer.send({
    topic: "user.registered",
    messages: [
      {
        key: "user-001",
        value: JSON.stringify({
          userId: "user-001",
          email: "john.doe@example.com",
          name: "John Doe",
          role: "doctor",
          institutionId: "inst-001",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent user registration event");

  // Test institution registration event
  await producer.send({
    topic: "institution.registered",
    messages: [
      {
        key: "inst-001",
        value: JSON.stringify({
          institutionId: "inst-001",
          name: "General Hospital",
          type: "hospital",
          address: "123 Health St, Medical City",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent institution registration event");

  // Test prescription filled event
  await producer.send({
    topic: "prescription.filled",
    messages: [
      {
        key: "prescription-001",
        value: JSON.stringify({
          prescriptionId: "rx-001",
          patientId: "patient-001",
          medicationName: "Amoxicillin",
          dosage: "500mg",
          doctorId: "user-001",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent prescription filled event");

  // Test lab order created event
  await producer.send({
    topic: "laborder.created",
    messages: [
      {
        key: "laborder-001",
        value: JSON.stringify({
          labOrderId: "lab-001",
          patientId: "patient-001",
          testType: "Blood Test",
          doctorId: "user-001",
          urgency: "normal",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent lab order created event");

  // Test SOAP note created event
  await producer.send({
    topic: "soapnote.created",
    messages: [
      {
        key: "soap-001",
        value: JSON.stringify({
          soapNoteId: "soap-001",
          patientId: "patient-001",
          doctorId: "user-001",
          chiefComplaint: "Chest pain",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent SOAP note created event");

  // Test lab sample created event
  await producer.send({
    topic: "lab.sample.created",
    messages: [
      {
        key: "sample-001",
        value: JSON.stringify({
          sampleId: "sample-001",
          patientId: "patient-001",
          sampleType: "blood",
          labOrderId: "lab-001",
          status: "collected",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent lab sample created event");

  // Test lab result processed event
  await producer.send({
    topic: "lab.result.processed",
    messages: [
      {
        key: "result-001",
        value: JSON.stringify({
          resultId: "result-001",
          patientId: "patient-001",
          sampleId: "sample-001",
          testType: "Blood Test",
          status: "completed",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent lab result processed event");

  await producer.disconnect();
  console.log("Test producer disconnected");
  console.log(
    "\n🎉 All test events sent! Check your activity timeline service logs and database."
  );
};

generateTestEvents().catch(console.error);
