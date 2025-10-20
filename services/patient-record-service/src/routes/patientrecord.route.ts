import { Router } from 'express';
import { PatientRecordController } from '../controllers/patientrecord';

const patientrecordRouter = Router();
const patientrecordController = new PatientRecordController();

    patientrecordRouter.post('/prescriptions/insert', patientrecordController.insertprescription.bind(patientrecordController));
    patientrecordRouter.post('/laborders/insert', patientrecordController.insertlaborder.bind(patientrecordController));
    patientrecordRouter.post('/soapnotes/insert', patientrecordController.insertsoapnote.bind(patientrecordController));
    patientrecordRouter.post('/quickexams/insert', patientrecordController.insertquickexam.bind(patientrecordController));
    patientrecordRouter.post('/careplans/insert', patientrecordController.insertCarePlan.bind(patientrecordController));
    patientrecordRouter.get('/soapnote/:patientid', patientrecordController.getSoapBypatientid.bind(patientrecordController));
    patientrecordRouter.get('/laborder/:patientid', patientrecordController.getLabOrderByPatientId.bind(patientrecordController));
    patientrecordRouter.get('/prescription/:patientid', patientrecordController.getPrescriptionByPatientId.bind(patientrecordController));
    patientrecordRouter.get('/quickexam/:patientid', patientrecordController.getQuickExamByPatientId.bind(patientrecordController));
    patientrecordRouter.get('/quickexam/last/:patientid',patientrecordController.getLastQuickExamByPatientId.bind(patientrecordController));
    patientrecordRouter.get('/visitedpatients',patientrecordController.getVisitedPatients.bind(patientrecordController));
    patientrecordRouter.get('/patientlist',patientrecordController.getPatientsForNurse.bind(patientrecordController));
    patientrecordRouter.get('/careplans/:patientid',patientrecordController.getCarePlanByPatientId.bind(patientrecordController));
    patientrecordRouter.get('/nurse/prescriptions',patientrecordController.getTodayPrescriptionsForNurse.bind(patientrecordController));
    patientrecordRouter.get('/nurse/patientcount',patientrecordController.getPatientCountForNurse.bind(patientrecordController));
    patientrecordRouter.get('/nurse/prescriptioncount',patientrecordController.getTodayPrescriptionCountForNurse.bind(patientrecordController));
    patientrecordRouter.get('/nurse/emergencypatients',patientrecordController.getEmergencyPatientCountForNurse.bind(patientrecordController));



export { patientrecordRouter };