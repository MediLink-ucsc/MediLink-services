import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "lab-test-producer",
  brokers: ["localhost:9094"],
});

const producer = kafka.producer();

const generateLabTestEvents = async () => {
  await producer.connect();
  console.log("Lab test producer connected to Kafka");

  // Test lab registration event
  await producer.send({
    topic: "lab.registered",
    messages: [
      {
        key: "lab-001",
        value: JSON.stringify({
          labId: "lab-001",
          name: "Clinical Diagnostics Lab",
          type: "clinical",
          location: "Building A, Floor 3",
          institutionId: "inst-001",
          capabilities: ["blood_test", "urine_test", "microbiology"],
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent lab registration event");

  // Test lab equipment added event
  await producer.send({
    topic: "lab.equipment.added",
    messages: [
      {
        key: "equipment-001",
        value: JSON.stringify({
          equipmentId: "eq-001",
          labId: "lab-001",
          equipmentName: "Automated Blood Analyzer",
          equipmentType: "analyzer",
          manufacturer: "MedTech Corp",
          model: "BA-5000",
          status: "operational",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent lab equipment added event");

  // Test lab equipment updated event
  await producer.send({
    topic: "lab.equipment.updated",
    messages: [
      {
        key: "equipment-001",
        value: JSON.stringify({
          equipmentId: "eq-001",
          labId: "lab-001",
          equipmentName: "Automated Blood Analyzer",
          equipmentType: "analyzer",
          manufacturer: "MedTech Corp",
          model: "BA-5000",
          status: "maintenance",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent lab equipment updated event");

  // Test lab staff assigned event
  await producer.send({
    topic: "lab.staff.assigned",
    messages: [
      {
        key: "assignment-001",
        value: JSON.stringify({
          staffId: "staff-001",
          labId: "lab-001",
          staffName: "Dr. Sarah Wilson",
          role: "lab_technician",
          department: "hematology",
          assignmentType: "permanent",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent lab staff assigned event");

  // Test lab workflow updated event
  await producer.send({
    topic: "lab.workflow.updated",
    messages: [
      {
        key: "workflow-001",
        value: JSON.stringify({
          workflowId: "wf-001",
          labId: "lab-001",
          workflowName: "Blood Sample Processing",
          workflowType: "sample_processing",
          changes: [
            "updated_quality_control_steps",
            "added_double_verification",
          ],
          updatedBy: "admin-001",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
  console.log("✅ Sent lab workflow updated event");

  await producer.disconnect();
  console.log("Lab test producer disconnected");
  console.log(
    "\n🎉 All lab test events sent! Check your activity timeline service logs and database."
  );
};

generateLabTestEvents().catch(console.error);
