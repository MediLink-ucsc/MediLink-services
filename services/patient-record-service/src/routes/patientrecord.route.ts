import { Router } from 'express';
import { PatientRecordController } from '../controllers/patientrecord';
import PatientRecordService  from '../services/patientrecord.service';

const patientrecordRouter = Router();
const patientrecordController = new PatientRecordController();

// institutionRouter.post('/lab/register', institutionController.labRegister.bind(institutionController));
// institutionRouter.post('/clinic/register', institutionController.clinicRegister.bind(institutionController));


export { patientrecordRouter };