import { Router } from 'express';
import { InstitutionController } from '../controllers/institution.contoller';
import InstitutionService from '../services/institution.service';

const institutionRouter = Router();
const institutionController = new InstitutionController();

institutionRouter.post(
  '/lab/register',
  institutionController.labRegister.bind(institutionController),
);
institutionRouter.post(
  '/clinic/register',
  institutionController.clinicRegister.bind(institutionController),
);
institutionRouter.patch(
  '/lab/verify/:labid',
  institutionController.verifyLab.bind(institutionController),
);
institutionRouter.patch(
  '/clinic/verify/:clinicid',
  institutionController.verifyClinic.bind(institutionController),
);
institutionRouter.get(
  '/clinics',
  institutionController.getAllClinics.bind(institutionController),
);
institutionRouter.get(
  '/labs',
  institutionController.getAllLabs.bind(institutionController),
);

// Get institution by admin user ID (for ADMIN login)
institutionRouter.get(
  '/admin/:adminUserId/institution',
  institutionController.getInstitutionByAdminUserId.bind(institutionController),
);

// Get institution details by ID and type
institutionRouter.get(
  '/:type/:institutionId/details',
  institutionController.getInstitutionDetails.bind(institutionController),
);

// Update institution details by ID and type
institutionRouter.patch(
  '/:type/:institutionId/details',
  institutionController.updateInstitutionDetails.bind(institutionController),
);

// Staff listing endpoints for institution admins
institutionRouter.get(
  '/clinic/:clinicId/staff',
  institutionController.getClinicStaff.bind(institutionController),
);
institutionRouter.get(
  '/lab/:labId/staff',
  institutionController.getLabStaff.bind(institutionController),
);

export { institutionRouter };
