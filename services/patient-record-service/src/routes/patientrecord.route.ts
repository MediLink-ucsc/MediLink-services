import { Router } from 'express';
import { PatientRecordController } from '../controllers/patientrecord';
import PatientRecordService  from '../services/patientrecord.service';

const patientrecordRouter = Router();
const patientrecordController = new PatientRecordController();

    patientrecordRouter.post('/prescriptions/insert', patientrecordController.insertprescription.bind(patientrecordController));
    patientrecordRouter.post('/laborders/insert', patientrecordController.insertlaborder.bind(patientrecordController));
    patientrecordRouter.post('/soapnotes/insert', patientrecordController.insertsoapnote.bind(patientrecordController));

export { patientrecordRouter };