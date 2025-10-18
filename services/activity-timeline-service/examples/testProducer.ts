import KafkaClient from "@medilink/kafka-client";

// Test event producer for development and testing
class TestEventProducer {
  private kafkaClient: KafkaClient;

  constructor() {
    this.kafkaClient = new KafkaClient("test-producer", ["localhost:9092"]);
  }

  async connect() {
    await this.kafkaClient.connect();
  }

  async disconnect() {
    await this.kafkaClient.disconnect();
  }

  async publishUserRegistered(userId: string, userData: any) {
    const producer = this.kafkaClient.getProducer();
    await producer.send({
      topic: "user.registered",
      messages: [
        {
          key: userId,
          value: JSON.stringify({
            userId,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  }

  async publishPrescriptionFilled(patientId: string, prescriptionData: any) {
    const producer = this.kafkaClient.getProducer();
    await producer.send({
      topic: "prescription.filled",
      messages: [
        {
          key: patientId,
          value: JSON.stringify({
            patientId,
            prescriptionId: prescriptionData.prescriptionId,
            medicationName: prescriptionData.medicationName,
            dosage: prescriptionData.dosage,
            doctorId: prescriptionData.doctorId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  }

  async publishLabOrderCreated(patientId: string, labOrderData: any) {
    const producer = this.kafkaClient.getProducer();
    await producer.send({
      topic: "laborder.created",
      messages: [
        {
          key: patientId,
          value: JSON.stringify({
            patientId,
            labOrderId: labOrderData.labOrderId,
            testType: labOrderData.testType,
            doctorId: labOrderData.doctorId,
            urgency: labOrderData.urgency,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  }

  async publishSoapNoteCreated(patientId: string, soapData: any) {
    const producer = this.kafkaClient.getProducer();
    await producer.send({
      topic: "soapnote.created",
      messages: [
        {
          key: patientId,
          value: JSON.stringify({
            patientId,
            soapNoteId: soapData.soapNoteId,
            doctorId: soapData.doctorId,
            chiefComplaint: soapData.chiefComplaint,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  }
}

// Example usage script
async function runTests() {
  const producer = new TestEventProducer();

  try {
    await producer.connect();
    console.log("Connected to Kafka");

    // Generate sample events
    await producer.publishUserRegistered("user-123", {
      email: "john.doe@example.com",
      name: "John Doe",
      role: "doctor",
    });

    await producer.publishPrescriptionFilled("patient-456", {
      prescriptionId: "rx-789",
      medicationName: "Amoxicillin",
      dosage: "500mg",
      doctorId: "user-123",
    });

    await producer.publishLabOrderCreated("patient-456", {
      labOrderId: "lab-101",
      testType: "Blood Test",
      doctorId: "user-123",
      urgency: "normal",
    });

    await producer.publishSoapNoteCreated("patient-456", {
      soapNoteId: "soap-202",
      doctorId: "user-123",
      chiefComplaint: "Recurring headaches",
    });

    console.log("Test events published successfully");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await producer.disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runTests();
}

export default TestEventProducer;
