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


  constructor() {
    this.prescriptionRepository = AppDataSource.getRepository(Prescription);
    this.medicationRepository = AppDataSource.getRepository(Medication);
    this.laborderRepository = AppDataSource.getRepository(LabOrder);
    this.labtestRepository = AppDataSource.getRepository(LabTest);
    this.soapNoteRepository = AppDataSource.getRepository(SoapNote);
    this.quickExamRepository = AppDataSource.getRepository(QuickExam);
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
