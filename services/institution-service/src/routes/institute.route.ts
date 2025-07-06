import { Router } from 'express';
import { InstitutionController } from '../controllers/institution.contoller';
import InstitutionService  from '../services/institution.service';

const institutionRouter = Router();
const institutionController = new InstitutionController();

institutionRouter.post('/lab/register', institutionController.labRegister.bind(institutionController));


export { institutionRouter };