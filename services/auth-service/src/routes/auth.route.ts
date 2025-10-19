import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const authRouter = Router();
const authController = new AuthController();

// authRouter.post('/register', authController.register.bind(authController));
// authRouter.post('/login', authController.login.bind(authController));
// authRouter.post('/logout', authController.logout.bind(authController));

authRouter.post(
  '/patient/register',
  authController.patientRegister.bind(authController),
);
authRouter.post(
  '/patient/login',
  authController.patientLogin.bind(authController),
);
authRouter.post('/patient/logout', authController.logout.bind(authController));

authRouter.post(
  '/medvaultpro/doctor/register',
  authController.doctorRegister.bind(authController),
);
authRouter.post(
  '/medvaultpro/login',
  authController.medvaultproLogin.bind(authController),
);
authRouter.post(
  '/medvaultpro/logout',
  authController.logout.bind(authController),
);

authRouter.post(
  '/medvaultpro/labadmin/register',
  authController.labAdminRegister.bind(authController),
);
authRouter.post(
  '/medvaultpro/clinicadmin/register',
  authController.clinicAdminRegister.bind(authController),
);

authRouter.post(
  '/medvaultpro/labassistant/register',
  authController.labAssistantRegister.bind(authController),
);

authRouter.post(
  '/medvaultpro/medicalstaff/register',
  authController.medicalStaffRegister.bind(authController),
);

authRouter.get(
  '/medvaultpro/doctor/profile/:doctorId',
  authController.getDoctorById.bind(authController),
);
authRouter.get(
  '/medvaultpro/doctor/patients',
  authController.getPatients.bind(authController),
);
authRouter.get(
  '/medvaultpro/doctor/patient/:username',
  authController.getPatientByUsername.bind(authController),
);
authRouter.get(
  '/medvaultpro/doctor/:doctorUserid',
  authController.getDoctorByUserid.bind(authController),
);

// Staff list endpoints for institution admins
authRouter.get(
  '/medvaultpro/hospital/:hospitalId/doctors',
  authController.getDoctorsByHospitalId.bind(authController),
);
authRouter.get(
  '/medvaultpro/hospital/:hospitalId/medical-staff',
  authController.getMedicalStaffByHospitalId.bind(authController),
);
authRouter.get(
  '/medvaultpro/lab/:labId/assistants',
  authController.getLabAssistantsByLabId.bind(authController),
);

authRouter.patch(
  '/medvaultpro/patient/:patientId/last-visited',
  authController.updatePatientLastVisited.bind(authController),
);
authRouter.patch(
  '/medvaultpro/patient/:patientId/condition',
  authController.updatePatientCondition.bind(authController),
);

authRouter.get(
  '/medvaultpro/doctors/:hospitalId',
  authController.getDoctorsByHospital.bind(authController),
);

// Password reset routes
authRouter.post(
  '/password-reset/request',
  authController.requestPasswordReset.bind(authController),
);
authRouter.post(
  '/password-reset/reset',
  authController.resetPassword.bind(authController),
);
authRouter.post(
  '/password-reset/verify-token',
  authController.verifyResetToken.bind(authController),
);

// Update staff routes (for admin use)
authRouter.patch(
  '/medvaultpro/doctor/:doctorId',
  authController.updateDoctor.bind(authController),
);
authRouter.patch(
  '/medvaultpro/medical-staff/:medicalStaffId',
  authController.updateMedicalStaff.bind(authController),
);
authRouter.patch(
  '/medvaultpro/lab-assistant/:labAssistantId',
  authController.updateLabAssistant.bind(authController),
);

export { authRouter };
