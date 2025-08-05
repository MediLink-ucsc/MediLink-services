import { Router } from 'express';
import { PatientRecordController } from '../controllers/patientrecord';
import PatientRecordService  from '../services/patientrecord.service';

const patientrecordRouter = Router();
const patientrecordController = new PatientRecordController();

    patientrecordRouter.post('/prescription', patientrecordController.insertprescription.bind(patientrecordController));


export { patientrecordRouter };