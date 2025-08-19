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

export const insertSoapNoteSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  dateTime: z.string().min(1, 'Date and time is required'),
  subjective: z.string().min(1, 'Subjective is required'),
  objective: z.string().min(1, 'Objective is required'),
  assessment: z.string().min(1, 'Assessment is required'),
  plan: z.string().min(1, 'Plan is required'),
});

export const insertQuickExamSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),

  bloodPressure: z.string().max(20).optional(),       // e.g. "120/80"
  heartRate: z.number().int().positive().optional(),  // bpm
  temperature: z.number().optional(),                  // Celsius
  spo2: z.number().int().min(0).max(100).optional(),  // %
  weight: z.number().positive().optional(),           // kg
  height: z.number().int().positive().optional(),     // cm

  generalAppearance: z.string().optional(),
  cardiovascular: z.string().optional(),
  respiratory: z.string().optional(),
  abdominal: z.string().optional(),
  neurological: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export class PatientRecordController {

    private patientRecordService: PatientRecordService;

  constructor() {
    this.patientRecordService = new PatientRecordService();
  }
  
    async getSoapBypatientid(req: Request, res: Response): Promise<any> {
      try {
        const patientId = req.params.patientid;

        if (!patientId) {
          return res.status(400).json({ message: 'Patient ID is required' });
        }

        const soapNotes = await this.patientRecordService.getSoapBypatientid(patientId);

        if (!soapNotes || soapNotes.length === 0) {
          return res.status(404).json({ message: `No SOAP notes found for patient ID ${patientId}` });
        }

        return res.json(soapNotes);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }

    async getLabOrderByPatientId(req: Request, res: Response): Promise<any> {
      try {
        const patientId = req.params.patientid;

        if (!patientId) {
          return res.status(400).json({ message: 'Patient ID is required' });
        }

        const labOrders = await this.patientRecordService.getLabOrderByPatientId(patientId);

        if (!labOrders || labOrders.length === 0) {
          return res.status(404).json({ message: `No lab orders found for patient ID ${patientId}` });
        }

        return res.json(labOrders);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }

    async getPrescriptionByPatientId(req: Request, res: Response): Promise<any> {
      try {
        const patientId = req.params.patientid;

        if (!patientId) {
          return res.status(400).json({ message: 'Patient ID is required' });
        }

        const prescriptions = await this.patientRecordService.getPrescriptionByPatientId(patientId);

        if (!prescriptions || prescriptions.length === 0) {
          return res.status(404).json({ message: `No prescriptions found for patient ID ${patientId}` });
        }

        return res.json(prescriptions);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }

    async getQuickExamByPatientId(req: Request, res: Response): Promise<any> {
      try {
        const patientId = req.params.patientid;

        if (!patientId) {
          return res.status(400).json({ message: 'Patient ID is required' });
        }

        const quickExams = await this.patientRecordService.getQuickExamByPatientId(patientId);

        if (!quickExams || quickExams.length === 0) {
          return res.status(404).json({ message: `No quick exams found for patient ID ${patientId}` });
        }

        return res.json(quickExams);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }





     async insertprescription(req: Request, res: Response, next: NextFunction): Promise<any> {
      try {
        const {
          patientId,
          medications,
          additionalInstructions,
        } = insertprescriptionSchema.parse(req.body);

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

        const result = await this.patientRecordService.insertprescription({
          patientId,
          doctorUserId ,
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

    async insertsoapnote(req: Request, res: Response, next: NextFunction): Promise<any> {
      try {
        // Validate input using Zod (you’ll need to define insertSoapNoteSchema separately)
        const {
          patientId,
          dateTime,
          subjective,
          objective,
          assessment,
          plan,
        } = insertSoapNoteSchema.parse(req.body);

        // Extract Authorization header
        const authHeader = req.headers.authorization;
        console.log('Authorization header:', authHeader);

        if (!authHeader) {
          return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        // Get token from "Bearer <token>"
        const token = authHeader.split(' ')[1];
        console.log('Token extracted:', token);

        // Get JWT secret
        const secret = process.env.AUTH_JWT_SECRET;
        if (!secret) {
          throw new Error('AUTH_JWT_SECRET is not defined');
        }

        // Decode and verify token
        const decoded = jwt.verify(token, secret) as { id: number; role: string };
        console.log('Decoded token:', decoded);

        // Role-based access check
        if (!decoded || decoded.role !== 'DOCTOR') {
          return res.status(403).json({ message: 'Forbidden: Not a doctor' });
        }

        // Extract doctorUserId from token
        const doctorUserId = decoded.id;

        // Call service to insert SOAP note
        const result = await this.patientRecordService.insertSoapNote({
          patientId,
          doctorUserId,
          dateTime,
          subjective,
          objective,
          assessment,
          plan,
        });

        return res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }

    
     async insertquickexam(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
          // Validate input using Zod schema (you need to define insertQuickExamSchema)
          const {
            patientId,
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
          } = insertQuickExamSchema.parse(req.body);

          // Extract Authorization header
          const authHeader = req.headers.authorization;
          if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
          }

          // Get token from "Bearer <token>"
          const token = authHeader.split(' ')[1];
          if (!token) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
          }

          // Get JWT secret
          const secret = process.env.AUTH_JWT_SECRET;
          if (!secret) {
            throw new Error('AUTH_JWT_SECRET is not defined');
          }

          // Decode and verify token
          const decoded = jwt.verify(token, secret) as { id: number; role: string };

          // Role-based access check (adjust roles as needed)
          if (!decoded || decoded.role !== 'DOCTOR') {
            return res.status(403).json({ message: 'Forbidden: Not authorized' });
          }

          const doctorUserId = decoded.id;

          // Call service to insert QuickExam record
          const result = await this.patientRecordService.insertQuickExam({
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
          });

          return res.status(201).json(result);
        } catch (error) {
          next(error);
        }
      }




}
