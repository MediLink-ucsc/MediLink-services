import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';


const authRouter = Router();
const authController = new AuthController();

// authRouter.post('/register', authController.register.bind(authController));
// authRouter.post('/login', authController.login.bind(authController));
// authRouter.post('/logout', authController.logout.bind(authController));

authRouter.post('/patient/register', authController.patientRegister.bind(authController));
authRouter.post('/patient/login', authController.patientLogin.bind(authController));
authRouter.post('/patient/logout', authController.logout.bind(authController));

authRouter.post('/medvaultpro/doctor/register', authController.doctorRegister.bind(authController));
authRouter.post('/medvaultpro/login', authController.medvaultproLogin.bind(authController));
authRouter.post('/medvaultpro/logout', authController.logout.bind(authController));

authRouter.post('/medvaultpro/labadmin/register', authController.labAdminRegister.bind(authController));

authRouter.post('/medvaultpro/labassistant/register', authController.labAssistantRegister.bind(authController));

authRouter.post('/medvaultpro/medicalstaff/register', authController.medicalStaffRegister.bind(authController));



export { authRouter };

