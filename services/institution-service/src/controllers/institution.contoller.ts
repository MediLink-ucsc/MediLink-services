import { Request, Response } from 'express';
import { z } from 'zod';
import InstitutionService from '../services/institution.service';

const registerLabSchema = z.object({
  institutionName: z.string().min(3).max(100),
  contactNumber: z.string().min(7).max(15).optional(),
  email: z.string().email().optional(),
  address: z.string().max(255).optional(),
  accreditationNumber: z.string().min(3).max(50),
  licenseExpiryDate: z.string().optional(),
  headTechnologistName: z.string().min(3).max(100).optional(),
  availableTests: z.string().optional(), 
});

export class InstitutionController {
  private institutionService: InstitutionService;

  constructor() {
    this.institutionService = new InstitutionService();
  }

  async labRegister(req: Request, res: Response): Promise<any> {
    const {
      institutionName,
      contactNumber,
      email,
      address,
      accreditationNumber,
      licenseExpiryDate,
      headTechnologistName,
      availableTests,
    } = registerLabSchema.parse(req.body);

    const lab = await this.institutionService.labRegister({
      institutionName,
      contactNumber,
      email,
      address,
      accreditationNumber,
      licenseExpiryDate,
      headTechnologistName,
      availableTests,
    });

    return res.status(201).json(lab);
  }
}
