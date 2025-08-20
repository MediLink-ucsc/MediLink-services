import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { createError } from '../utils';
import { publishPrescriptionFilled } from '../events/producers/prescriptionFilled.producer';
import logger from '../config/logger';
import { Medication } from '../entity/medication.entity';
import { Prescription } from '../entity/prescription.entity';
import { LabOrder } from '../entity/laborder.entity';
import { LabTest } from '../entity/labtest.entity';
import { SoapNote } from '../entity/soap.entity';
import { QuickExam } from '../entity/quickexam.entity';
import { publishLabOrderCreated } from '../events/producers/laborderCreated.producer';
import { publishSoapNoteCreated } from '../events/producers/soapnoteCreated.producer';
import { publishQuickExamCreated } from '../events/producers/quickexamCreated.producer';
import axios from 'axios';
import { CareTask } from '../entity/caretask.entity';
import { publishCarePlanCreated } from '../events/producers/careplanCreated.producer';
import { CarePlan } from '../entity/careplan.entity';

export interface InsertCarePlanDto {
  patientId: string;
  nurseUserId: number; // ID of the nurse creating the care plan
  planType: string; // e.g., "Post-Surgical Care"
  priority?: string; // e.g., "Low", "Medium", "High"
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  description: string;
  goals?: string;
  tasks?: {
    taskDescription: string;
    dueDate: string; // ISO date string
    priority?: string; // e.g., "Low", "Medium", "High"
  }[];
}

export interface InsertPrescriptionDto {
  patientId: string;
  doctorUserId: number;
  medications: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  additionalInstructions?: string;
}

export interface InsertLabOrderDto {
  patientId: number;
  doctorUserId: number;
  clinicalInformation?: string;
  tests: {
    name: string;
    urgency?: string;
    specialInstructions?: string;
  }[];
}

export interface InsertSoapNoteDto {
  patientId: string;
  doctorUserId: number;
  dateTime: string | Date;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface InsertQuickExamDto {
  patientId: string;          // patient ID as string
  doctorUserId: number;       // ID of doctor creating the exam

  bloodPressure?: string;     // e.g. "120/80"
  heartRate?: number;         // bpm
  temperature?: number;       // Celsius
  spo2?: number;              // %
  weight?: number;            // kg
  height?: number;            // cm

  generalAppearance?: string;
  cardiovascular?: string;
  respiratory?: string;
  abdominal?: string;
  neurological?: string;
  additionalNotes?: string;
}


class PatientRecordService {
  private prescriptionRepository: Repository<Prescription>;
  private medicationRepository: Repository<Medication>;
  private laborderRepository: Repository<LabOrder>;
  private labtestRepository: Repository<LabTest>;
  private soapNoteRepository: Repository<SoapNote>;
  private quickExamRepository: Repository<QuickExam>;
  private carePlanRepository: Repository<CarePlan>;
  private careTaskRepository: Repository<CareTask>;
  


  constructor() {
    this.prescriptionRepository = AppDataSource.getRepository(Prescription);
    this.medicationRepository = AppDataSource.getRepository(Medication);
    this.laborderRepository = AppDataSource.getRepository(LabOrder);
    this.labtestRepository = AppDataSource.getRepository(LabTest);
    this.soapNoteRepository = AppDataSource.getRepository(SoapNote);
    this.quickExamRepository = AppDataSource.getRepository(QuickExam);
    this.carePlanRepository = AppDataSource.getRepository(CarePlan);
    this.careTaskRepository = AppDataSource.getRepository(CareTask);
  }


    async getSoapBypatientid(patientId: string): Promise<any[]> {
      // 1. Fetch SOAP notes for the patient
      const soapNotes = await this.soapNoteRepository.find({
        where: { patientId },
      });

      if (!soapNotes || soapNotes.length === 0) {
        return [];
      }

      // 2. For each SOAP note, fetch doctor details from external API
      const soapNotesWithDoctor = await Promise.all(
        soapNotes.map(async (note) => {
          try {
            const doctorResponse = await axios.get(
              `http://localhost:3000/api/v1/auth/medvaultpro/doctor/${note.doctorUserId}`
            );

            return {
              id: note.id,
              patientId: note.patientId,
              doctorUserId: note.doctorUserId,
              doctor: doctorResponse.data, // doctor details from API
              dateTime: note.dateTime,
              subjective: note.subjective,
              objective: note.objective,
              assessment: note.assessment,
              plan: note.plan,
            };
          } catch (error) {
            console.error(`Error fetching doctor details for doctorUserId ${note.doctorUserId}:`, error);
            return {
              id: note.id,
              patientId: note.patientId,
              doctorUserId: note.doctorUserId,
              doctor: null, // If API fails, doctor info is null
              dateTime: note.dateTime,
              subjective: note.subjective,
              objective: note.objective,
              assessment: note.assessment,
              plan: note.plan,
            };
          }
        })
      );

      return soapNotesWithDoctor;
    }

    async getQuickExamByPatientId(patientId: string): Promise<any[]> {
      // 1. Fetch Quick Exams for the patient
      const quickExams = await this.quickExamRepository.find({
        where: { patientId },
        order: { createdAt: 'DESC' }, 
      });

      if (!quickExams || quickExams.length === 0) {
        return [];
      }

      // 2. Attach doctor details to each Quick Exam
      const quickExamsWithDoctor = await Promise.all(
        quickExams.map(async (exam) => {
          try {
            const doctorResponse = await axios.get(
              `http://localhost:3000/api/v1/auth/medvaultpro/doctor/${exam.doctorUserId}`
            );

            return {
              id: exam.id,
              patientId: exam.patientId,
              doctorUserId: exam.doctorUserId,
              doctor: doctorResponse.data, // doctor details from API
              bloodPressure: exam.bloodPressure,
              heartRate: exam.heartRate,
              temperature: exam.temperature,
              spo2: exam.spo2,
              weight: exam.weight,
              height: exam.height,
              generalAppearance: exam.generalAppearance,
              cardiovascular: exam.cardiovascular,
              respiratory: exam.respiratory,
              abdominal: exam.abdominal,
              neurological: exam.neurological,
              additionalNotes: exam.additionalNotes,
              createdAt: exam.createdAt,
            };
          } catch (error) {
            console.error(
              `Error fetching doctor details for doctorUserId ${exam.doctorUserId}:`,
              error
            );

            return {
              id: exam.id,
              patientId: exam.patientId,
              doctorUserId: exam.doctorUserId,
              doctor: null, // If API fails, doctor info is null
              bloodPressure: exam.bloodPressure,
              heartRate: exam.heartRate,
              temperature: exam.temperature,
              spo2: exam.spo2,
              weight: exam.weight,
              height: exam.height,
              generalAppearance: exam.generalAppearance,
              cardiovascular: exam.cardiovascular,
              respiratory: exam.respiratory,
              abdominal: exam.abdominal,
              neurological: exam.neurological,
              additionalNotes: exam.additionalNotes,
              createdAt: exam.createdAt,
            };
          }
        })
      );

      return quickExamsWithDoctor;
    }


    async getLabOrderByPatientId(patientId: string): Promise<any[]> {
      // 1. Fetch Lab Orders for the patient (including lab tests)
      const labOrders = await this.laborderRepository.find({
        where: { patientId: Number(patientId) }, // ensure numeric comparison
        relations: ['labTests'], // include associated lab tests
        order: { createdAt: 'DESC' }, // latest orders first
      });

      if (!labOrders || labOrders.length === 0) {
        return [];
      }

      // 2. For each Lab Order, fetch doctor details from external API
      const labOrdersWithDoctor = await Promise.all(
        labOrders.map(async (order) => {
          try {
            const doctorResponse = await axios.get(
              `http://localhost:3000/api/v1/auth/medvaultpro/doctor/${order.doctorUserId}`
            );

            return {
              labOrderId: order.labOrderId,
              patientId: order.patientId,
              doctorUserId: order.doctorUserId,
              doctor: doctorResponse.data, // doctor details
              clinicalInformation: order.clinicalInformation,
              createdAt: order.createdAt,
              labTests: order.labTests.map((test) => ({
                labTestId: test.labTestId,
                name: test.name,
                urgency: test.urgency,
                specialInstructions: test.specialInstructions,
              })),
            };
          } catch (error) {
            console.error(
              `Error fetching doctor details for doctorUserId ${order.doctorUserId}:`,
              error
            );

            return {
              labOrderId: order.labOrderId,
              patientId: order.patientId,
              doctorUserId: order.doctorUserId,
              doctor: null, // doctor info missing if API fails
              clinicalInformation: order.clinicalInformation,
              createdAt: order.createdAt,
              labTests: order.labTests.map((test) => ({
                labTestId: test.labTestId,
                name: test.name,
                urgency: test.urgency,
                specialInstructions: test.specialInstructions,
              })),
            };
          }
        })
      );

      return labOrdersWithDoctor;
    }

    async getPrescriptionByPatientId(patientId: string): Promise<any[]> {
      // 1. Fetch prescriptions for the patient (including medications)
      const prescriptions = await this.prescriptionRepository.find({
        where: { patientId: patientId }, // patientId is string (UUID)
        relations: ['medications'], // include associated medications
        order: { createdAt: 'DESC' }, // latest prescriptions first
      });

      if (!prescriptions || prescriptions.length === 0) {
        return [];
      }

      // 2. For each prescription, fetch doctor details from external API
      const prescriptionsWithDoctor = await Promise.all(
        prescriptions.map(async (prescription) => {
          try {
            const doctorResponse = await axios.get(
              `http://localhost:3000/api/v1/auth/medvaultpro/doctor/${prescription.doctorUserId}`
            );

            return {
              prescriptionId: prescription.id,
              patientId: prescription.patientId,
              doctorUserId: prescription.doctorUserId,
              doctor: doctorResponse.data, // doctor details
              additionalInstructions: prescription.additionalInstructions,
              createdAt: prescription.createdAt,
              medications: prescription.medications.map((med) => ({
                medicationId: med.id,
                medicineName: med.medicineName,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
              })),
            };
          } catch (error) {
            console.error(
              `Error fetching doctor details for doctorUserId ${prescription.doctorUserId}:`,
              error
            );

            return {
              prescriptionId: prescription.id,
              patientId: prescription.patientId,
              doctorUserId: prescription.doctorUserId,
              doctor: null, // doctor info missing if API fails
              additionalInstructions: prescription.additionalInstructions,
              createdAt: prescription.createdAt,
              medications: prescription.medications.map((med) => ({
                medicationId: med.id,
                medicineName: med.medicineName,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
              })),
            };
          }
        })
      );

      return prescriptionsWithDoctor;
    }

    

    async insertCarePlan({
      patientId,
      nurseUserId,
      planType,
      priority,
      startDate,
      endDate,
      description,
      goals,
      tasks,
    }: InsertCarePlanDto) {
      // Create new CarePlan entity
      const carePlan = new CarePlan();
      carePlan.patientId = patientId;
      carePlan.nurseId = nurseUserId.toString(); // nurse assigned to this plan
      carePlan.planType = planType;
      carePlan.priority = priority ?? 'Medium'; // Default priority as string
      carePlan.startDate = new Date(startDate);
      carePlan.endDate = new Date(endDate);
      carePlan.description = description;
      carePlan.goals = goals ?? '';

      // Save care plan first to get an ID
      await this.carePlanRepository.save(carePlan);

      // Create and save tasks if any
      if (tasks && tasks.length > 0) {
        for (const t of tasks) {
          const task = new CareTask();
          task.carePlan = carePlan;
          task.taskDescription = t.taskDescription;
          task.dueDate = new Date(t.dueDate);
          task.priority = t.priority ?? 'Medium'; 

          await this.careTaskRepository.save(task);
        }
      }

      // Optional: Publish event (Kafka or other message bus)
      try {
        await publishCarePlanCreated({
          key: carePlan.id.toString(),
          value: carePlan,
        });
      } catch (error) {
        logger.error('Failed to publish care plan creation event:', error);
      }

      return {
        carePlanId: carePlan.id,
        message: 'Care plan created successfully',
      };
    }


    async insertprescription({
          patientId,
          doctorUserId,
          medications,
          additionalInstructions,
        
      }:InsertPrescriptionDto){

          // Create new Prescription entity
          const prescription = new Prescription();
          prescription.patientId = patientId;
          prescription.doctorUserId = doctorUserId;
          prescription.additionalInstructions = additionalInstructions ?? '';

          // Save prescription first to get an ID
          await this.prescriptionRepository.save(prescription);

          // Create and save medications
          for (const med of medications) {
            const medication = new Medication();
            medication.prescription = prescription;
            medication.medicineName = med.medicineName;
            medication.dosage = med.dosage;
            medication.frequency = med.frequency;
            medication.duration = med.duration;

            await this.medicationRepository.save(medication);
          }

          // Optional: Publish event (can be replaced with appropriate Kafka topic)
          try {
            await publishPrescriptionFilled({
              key: prescription.id.toString(),
              value: prescription,
            });
          } catch (kafkaError) {
            logger.error('Failed to publish prescription creation event:', kafkaError);
          }

          return {
            prescriptionId: prescription.id,
            message: 'Prescription created successfully',
          };
        }

      async insertlaborder({
        patientId,
        doctorUserId,
        clinicalInformation,
        tests,
      }: InsertLabOrderDto ) {
        // Create new LabOrder entity
        const labOrder = new LabOrder();
        labOrder.patientId = patientId;
        labOrder.doctorUserId = doctorUserId;
        labOrder.clinicalInformation = clinicalInformation ?? '';

        // Save LabOrder first to get an ID
        await this.laborderRepository.save(labOrder);

        // Create and save LabTests linked to LabOrder
        for (const test of tests) {
          const labTest = new LabTest();
          labTest.labOrder = labOrder;
          labTest.name = test.name;
          labTest.urgency = test.urgency ?? 'Routine';
          labTest.specialInstructions = test.specialInstructions ?? '';

          await this.labtestRepository.save(labTest);
        }

        // Optional: publish event or logging here
        try {
          await publishLabOrderCreated({
            key: labOrder.labOrderId.toString(),
            value: labOrder,
          });
        } catch (error) {
          logger.error('Failed to publish lab order event:', error);
        }

        return {
          labOrderId: labOrder.labOrderId,
          message: 'Lab order with tests created successfully',
        };
      }

      async insertSoapNote({
        patientId,
        doctorUserId,
        dateTime,
        subjective,
        objective,
        assessment,
        plan,
      }: InsertSoapNoteDto) {
        // Create new SoapNote entity
        const soapNote = new SoapNote();

        soapNote.patientId = patientId;
        soapNote.doctorUserId = doctorUserId;
        soapNote.dateTime = new Date(dateTime);
        soapNote.subjective = subjective;
        soapNote.objective = objective;
        soapNote.assessment = assessment;
        soapNote.plan = plan;

        // Save SoapNote entity
        await this.soapNoteRepository.save(soapNote);

        // Optional: publish event or logging here
        try {
          await publishSoapNoteCreated({
            key: soapNote.id.toString(),
            value: soapNote,
          });
        } catch (error) {
          logger.error('Failed to publish SOAP note event:', error);
        }

        return {
          soapNoteId: soapNote.id,
          message: 'SOAP note created successfully',
        };
      }

      async insertQuickExam({
        patientId,
        doctorUserId,
        bloodPressure,
        heartRate,
        temperature,
        spo2,
        weight,
        height,
        generalAppearance,
        cardiovascular,
        respiratory,
        abdominal,
        neurological,
        additionalNotes,
      }: InsertQuickExamDto) {
        const quickExam = new QuickExam();

        quickExam.patientId = patientId; 
        quickExam.doctorUserId = doctorUserId; 
        quickExam.bloodPressure = bloodPressure;
        quickExam.heartRate = heartRate;
        quickExam.temperature = temperature;
        quickExam.spo2 = spo2;
        quickExam.weight = weight;
        quickExam.height = height;
        quickExam.generalAppearance = generalAppearance;
        quickExam.cardiovascular = cardiovascular;
        quickExam.respiratory = respiratory;
        quickExam.abdominal = abdominal;
        quickExam.neurological = neurological;
        quickExam.additionalNotes = additionalNotes;

        // Save QuickExam entity
        await this.quickExamRepository.save(quickExam);

        // Optional: publish event or logging here
        try {
          await publishQuickExamCreated({
            key: quickExam.id.toString(),
            value: quickExam,
          });
        } catch (error) {
          logger.error('Failed to publish QuickExam event:', error);
        }

        return {
          quickExamId: quickExam.id,
          message: 'Quick exam record created successfully',
        };
      }



  
}


export default PatientRecordService;
