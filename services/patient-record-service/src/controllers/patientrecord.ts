import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import PatientRecordService from '../services/patientrecord.service';

export const insertprescriptionSchema = z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    medications: z.array(z.object({
      medicineName: z.string().min(1, 'Medicine name is required'),
      dosage: z.string().min(1, 'Dosage is required'),
      frequency: z.string().min(1, 'Frequency is required'),
      duration: z.string().min(1, 'Duration is required'),
    })).min(1, 'At least one medication is required'),
    additionalInstructions: z.string().optional(),
  });

export class PatientRecordController {

    private patientRecordService: PatientRecordService;

  constructor() {
    this.patientRecordService = new PatientRecordService();
  }

     async insertprescription(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const {
        patientId,
        medications,
        additionalInstructions,
      } = insertprescriptionSchema.parse(req.body);

      const result = await this.patientRecordService.insertprescription({
        patientId,
        medications,
        additionalInstructions,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }


}
