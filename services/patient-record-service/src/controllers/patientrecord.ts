import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import PatientRecordService from '../services/patientrecord.service';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


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


export const insertLabTestSchema = z.object({
  patientId: z.number().int().positive(),
  clinicalInformation: z.string().optional(),
  tests: z.array(
    z.object({
      name: z.string().min(1, 'Test name is required'),
      urgency: z.string().optional().default('Routine'),
      specialInstructions: z.string().optional(),
    })
  ).min(1, 'At least one test is required'),

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

    async insertlaborder(req: Request, res: Response, next: NextFunction): Promise<any> {
      try {
        const {
          patientId,
          tests,
          clinicalInformation,
        } = insertLabTestSchema.parse(req.body);

        console.log('Parsed body:', { patientId, tests, clinicalInformation });


        const authHeader = req.headers.authorization;
         console.log('Authorization header:', authHeader);
        if (!authHeader) {
          return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>

       
        console.log('Token extracted:', token);


        // Verify and decode token
        const secret = process.env.AUTH_JWT_SECRET;
        console.log(secret)

        if (!secret) {
          throw new Error('AUTH_JWT_SECRET is not defined');
        }

        const decoded = jwt.verify(token, secret) as unknown as { id: number; role: string };

        
        console.log('Decoded token:', decoded);

        if (!decoded || decoded.role !== 'DOCTOR') {
          return res.status(403).json({ message: 'Forbidden: Not a doctor' });
        }

        const doctorUserId = decoded.id;
        console.log('Decoded doctorUserId:', doctorUserId);


        const createdLabOrder = await this.patientRecordService.insertlaborder({
          patientId,
          doctorUserId,
          tests,
          clinicalInformation,
        });

        return res.status(201).json(createdLabOrder);
      } catch (error) {
        next(error);
      }
    }




}
