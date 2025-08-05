import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { createError } from '../utils';
import { publishPrescriptionFilled } from '../events/producers/prescriptionFilled.producer';
import logger from '../config/logger';
import { Medication } from '../entity/medication.entity';
import { Prescription } from '../entity/prescription.entity';

export interface InsertPrescriptionDto {
  patientId: string;
  medications: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  additionalInstructions?: string;
}

class PatientRecordService {
  private prescriptionRepository: Repository<Prescription>;
  private medicationRepository: Repository<Medication>;

  constructor() {
    this.prescriptionRepository = AppDataSource.getRepository(Prescription);
    this.medicationRepository = AppDataSource.getRepository(Medication);
  }

  async insertprescription({
    patientId,
    medications,
    additionalInstructions,
  
}:InsertPrescriptionDto){
  // Optional: Check if patient exists or if a duplicate prescription exists
    // const existing = await this.prescriptionRepository.findOneBy({ patientId });
    // if (existing) {
    //   throw createError('Prescription already exists for this patient', 400);
    // }

    // Create new Prescription entity
    const prescription = new Prescription();
    prescription.patientId = patientId;
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
  
}


export default PatientRecordService;
