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


export const registerClinicSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  provinceState: z.string().min(1, 'Province/State is required'),
  postalCode: z.string().optional(),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  emailAddress: z.string().email('Invalid email address'),
  website: z.string().optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  institutionLogo: z.string().optional(),
  adminUserId: z.number({
    required_error: 'Admin user ID is required',
    invalid_type_error: 'Admin user ID must be a number',
  }),
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

  async clinicRegister(req: Request, res: Response): Promise<any> {
  const {
    institutionName,
    address,
    city,
    provinceState,
    postalCode,
    phoneNumber,
    emailAddress,
    website,
    licenseNumber,
    institutionLogo,
    adminUserId,
  } = registerClinicSchema.parse(req.body);

  const clinic = await this.institutionService.clinicRegister({
    institutionName,
    address,
    city,
    provinceState,
    postalCode: postalCode ?? "",
    phoneNumber,
    emailAddress,
    website,
    licenseNumber,
    institutionLogo,
    adminUserId,
  });

  return res.status(201).json(clinic);
}

}
