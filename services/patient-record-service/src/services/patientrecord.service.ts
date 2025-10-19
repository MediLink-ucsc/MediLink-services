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
import { PatientDoctorRecord } from '../entity/patientvisit.entity';
import { In, Between } from 'typeorm';


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
  private patientDoctorRecordRepository: Repository<PatientDoctorRecord>;

  


  constructor() {
    this.prescriptionRepository = AppDataSource.getRepository(Prescription);
    this.medicationRepository = AppDataSource.getRepository(Medication);
    this.laborderRepository = AppDataSource.getRepository(LabOrder);
    this.labtestRepository = AppDataSource.getRepository(LabTest);
    this.soapNoteRepository = AppDataSource.getRepository(SoapNote);
    this.quickExamRepository = AppDataSource.getRepository(QuickExam);
    this.carePlanRepository = AppDataSource.getRepository(CarePlan);
    this.careTaskRepository = AppDataSource.getRepository(CareTask);
    this.patientDoctorRecordRepository = AppDataSource.getRepository(PatientDoctorRecord);
  }

    async getCarePlanByPatientId(patientId: string): Promise<any[]> {
      const carePlans = await this.carePlanRepository.find({
        where: { patientId: patientId },
        order: { createdAt: 'DESC' },
        take: 3, // ✅ only the latest 3
      });

      return carePlans;
    }

    async getVisitedPatients(doctorUserId: number): Promise<any[]> {
    // Step 1: Get all patients from Auth Service
    const authResponse = await axios.get('http://localhost:3000/api/v1/auth/medvaultpro/doctor/patients'); 
    const allPatients = authResponse.data;

    if (!allPatients || !allPatients.length) return [];

    // Step 2: Get patient-doctor visit records for this doctor
    const records = await this.patientDoctorRecordRepository.find({
      where: { doctorId: doctorUserId },
    });

    if (!records.length) return [];

    const visitedPatientIds = records.map((r) => r.patientId);

    // Step 3: Filter only previously visited patients
    const visitedPatients = allPatients.filter((p: any) =>
     
      visitedPatientIds.includes(Number(p.patientId))
    );

    return visitedPatients;
  }



    async getPatientsForNurse(hospitalId: number): Promise<any[]> {
      // Step 1: Get all doctors in this hospital from Auth Service
      const doctorResponse = await axios.get(`http://localhost:3000/api/v1/auth/medvaultpro/doctors/${hospitalId}`);
      const allDoctors = doctorResponse.data;
      console.log('All Doctors:', allDoctors);

      if (!allDoctors || !allDoctors.length) return [];

      const doctorIds = allDoctors.map((doc: any) => Number(doc.user.id));
      console.log('Doctor IDs in Hospital:', doctorIds);

      // Step 2: Get all patients from Auth Service
      const patientResponse = await axios.get('http://localhost:3000/api/v1/auth/medvaultpro/doctor/patients');
      const allPatients = patientResponse.data;
      console.log('All Patients:', allPatients);

      if (!allPatients || !allPatients.length) return [];

      // Step 3: Get patient-doctor visit records for all doctors in this hospital
      const records = await this.patientDoctorRecordRepository.find({
        where: { doctorId: In(doctorIds) },
      });

      console.log('Patient-Doctor Visit Records:', records);
      if (!records.length) return [];

      const visitedPatientIds = records.map(r => Number(r.patientId)); // ensure numeric IDs
      console.log('Visited Patient IDs:', visitedPatientIds);

      // ✅ Step 4: Filter patients who visited these doctors (convert both to same type)
      const visitedPatients = allPatients.filter((patient: any) =>
        visitedPatientIds.includes(Number(patient.patientId))
      );

      console.log('Visited Patients:', visitedPatients);

      return visitedPatients;
    }

    async getTodayPrescriptionsForNurse(hospitalId: number): Promise<any[]> {
      // Step 1️⃣ - Get all doctors in this hospital from Auth Service
      const doctorResponse = await axios.get(
        `http://localhost:3000/api/v1/auth/medvaultpro/doctors/${hospitalId}`
      );
      const allDoctors = doctorResponse.data;
      if (!allDoctors || !allDoctors.length) return [];

      const doctorIds = allDoctors.map((doc: any) => Number(doc.user.id));
      console.log('Doctor IDs in Hospital:', doctorIds);

      // Step 2️⃣ - Get all patients from Auth Service
      const patientResponse = await axios.get(
        'http://localhost:3000/api/v1/auth/medvaultpro/doctor/patients'
      );
      const allPatients = patientResponse.data;
      console.log('All Patients:', allPatients);

      if (!allPatients || !allPatients.length) return [];

      // Step 3️⃣ - Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Step 4️⃣ - Get prescriptions for today issued by those doctors
      const prescriptions = await this.prescriptionRepository.find({
        where: {
          doctorUserId: In(doctorIds),
          createdAt: Between(startOfDay, endOfDay),
        },
        relations: ['medications'],
      });

      if (!prescriptions.length) return [];

      // Step 5️⃣ - Combine doctor + patient info into prescriptions
      const enrichedPrescriptions = prescriptions.map((prescription) => {
        const doctorInfo = allDoctors.find(
          (doc: any) => Number(doc.user.id) === Number(prescription.doctorUserId)
        );

        const patientInfo = allPatients.find(
          (p: any) => Number(p.patientId) === Number(prescription.patientId)
        );

        console.log('Doctor Info:', doctorInfo);

        return {
          ...prescription,
          doctor: doctorInfo
            ? {
                firstName: doctorInfo.user.firstName,
                lastName: doctorInfo.user.lastName,
                specialty: doctorInfo.specialty,
                hospitalName: doctorInfo.hospitalName,
              }
            : null,
          patient: patientInfo
            ? {
                firstName: patientInfo.user.firstName,
                lastName: patientInfo.user.lastName,
                gender: patientInfo.gender,
                age: patientInfo.age,
              }
            : null,
        };
      });

      return enrichedPrescriptions;
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

    async getLastQuickExamByPatientId(patientId: string): Promise<any | null> {
      // 1. Fetch the latest Quick Exam for the patient
      const exam = await this.quickExamRepository.findOne({
        where: { patientId },
        order: { createdAt: 'DESC' }, // newest first
      });

      if (!exam) return null;

      // 2. Attach doctor details
      try {
        const doctorResponse = await axios.get(
          `http://localhost:3000/api/v1/auth/medvaultpro/doctor/${exam.doctorUserId}`
        );

        return {
          id: exam.id,
          patientId: exam.patientId,
          doctorUserId: exam.doctorUserId,
          doctor: doctorResponse.data,
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
          doctor: null,
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
        order: { createdAt: 'DESC' },
        take: 5 // latest prescriptions first
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

          let record = await this.patientDoctorRecordRepository.findOne({
          where: { patientId: Number(patientId), doctorId: doctorUserId },
        });

        if (record) {
          // Update last visited date to the current time
          record.lastVisitedDate = new Date();

          console.log('updating record');
          console.log(record);
        } else {
          // Create new record
          record = this.patientDoctorRecordRepository.create({
            patientId: Number(patientId),
            doctorId: doctorUserId,
            lastVisitedDate: new Date(),
          });

          console.log('creating new record');
          console.log(record);
        }

        await this.patientDoctorRecordRepository.save(record);

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

        let record = await this.patientDoctorRecordRepository.findOne({
          where: { patientId: Number(patientId), doctorId: doctorUserId },
        });

        if (record) {
          // Update last visited date to the current time
          record.lastVisitedDate = new Date();

          console.log('updating record');
          console.log(record);
        } else {
          // Create new record
          record = this.patientDoctorRecordRepository.create({
            patientId: Number(patientId),
            doctorId: doctorUserId,
            lastVisitedDate: new Date(),
          });

          console.log('creating new record');
          console.log(record);
        }

        await this.patientDoctorRecordRepository.save(record);

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

        let record = await this.patientDoctorRecordRepository.findOne({
          where: { patientId: Number(patientId), doctorId: doctorUserId },
        });

        if (record) {
          // Update last visited date to the current time
          record.lastVisitedDate = new Date();

          console.log('updating record');
          console.log(record);
        } else {
          // Create new record
          record = this.patientDoctorRecordRepository.create({
            patientId: Number(patientId),
            doctorId: doctorUserId,
            lastVisitedDate: new Date(),
          });

          console.log('creating new record');
          console.log(record);
        }

        await this.patientDoctorRecordRepository.save(record);



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

        let record = await this.patientDoctorRecordRepository.findOne({
          where: { patientId: Number(patientId), doctorId: doctorUserId },
        });

        if (record) {
          // Update last visited date to the current time
          record.lastVisitedDate = new Date();

          console.log('updating record');
          console.log(record);
        } else {
          // Create new record
          record = this.patientDoctorRecordRepository.create({
            patientId: Number(patientId),
            doctorId: doctorUserId,
            lastVisitedDate: new Date(),
          });

          console.log('creating new record');
          console.log(record);
        }

        await this.patientDoctorRecordRepository.save(record);

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
