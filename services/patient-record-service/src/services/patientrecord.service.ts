import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { createError } from '../utils';
import { publishPrescriptionFilled } from '../events/producers/prescriptionFilled.producer';
import logger from '../config/logger';
import { Medication } from '../entity/medication.entity';
import { Prescription } from '../entity/prescription.entity';
import { LabOrder } from '../entity/laborder.entity';
import { LabTest } from '../entity/labtest.entity';
import { publishLabOrderCreated } from '../events/producers/laborderCreated.producer';
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


class PatientRecordService {
  private prescriptionRepository: Repository<Prescription>;
  private medicationRepository: Repository<Medication>;
  private laborderRepository: Repository<LabOrder>
  private labtestRepository: Repository<LabTest>


  constructor() {
    this.prescriptionRepository = AppDataSource.getRepository(Prescription);
    this.medicationRepository = AppDataSource.getRepository(Medication);
    this.laborderRepository = AppDataSource.getRepository(LabOrder);
    this.labtestRepository = AppDataSource.getRepository(LabTest);
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

  
}


export default PatientRecordService;
