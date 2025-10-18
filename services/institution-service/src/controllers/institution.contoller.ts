import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import InstitutionService from '../services/institution.service';

const registerLabSchema = z.object({
  institutionName: z.string().min(3).max(150),
  address: z.string().max(255),
  city: z.string().max(100),
  provinceState: z.string().max(100),
  postalCode: z.string().max(20),
  phoneNumber: z.string().min(7).max(20),
  emailAddress: z.string().email(),
  website: z.string().max(255).optional(),
  licenseNumber: z.string().min(3).max(50),
  institutionLogo: z.string().optional(),
  adminUserId: z.number(),
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

  async labRegister(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
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
      } = registerLabSchema.parse(req.body);

      const lab = await this.institutionService.labRegister({
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
      });

      return res.status(201).json(lab);
    } catch (error) {
      next(error);
    }
  }

  async clinicRegister(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
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
        postalCode: postalCode ?? '',
        phoneNumber,
        emailAddress,
        website,
        licenseNumber,
        institutionLogo,
        adminUserId,
      });

      return res.status(201).json(clinic);
    } catch (error) {
      next(error);
    }
  }

  async verifyLab(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const { labid } = req.params; // ✅ using labid from the route
      const lab = await this.institutionService.verifyLab(Number(labid));

      return res.status(200).json({
        message: 'Lab verified successfully',
        data: lab,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyClinic(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const { clinicid } = req.params; // ✅ using clinicid from the route
      const clinic = await this.institutionService.verifyClinic(
        Number(clinicid),
      );

      return res.status(200).json({
        message: 'Clinic verified successfully',
        data: clinic,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllClinics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const clinics = await this.institutionService.getAllClinics();

      return res.status(200).json({
        data: clinics,
      });
    } catch (error) {
      next(error);
    }
  }
  async getAllLabs(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const labs = await this.institutionService.getAllLabs();

      return res.status(200).json({
        data: labs,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClinicStaff(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      console.log('🔍 [Institution Controller] getClinicStaff called');
      console.log('📝 [Institution Controller] Request params:', req.params);
      // console.log('👤 [Institution Controller] Request user:', req.user);
      console.log('🔑 [Institution Controller] Request headers:', req.headers);

      const { clinicId } = req.params;
      console.log(
        `🏥 [Institution Controller] Fetching staff for clinic ID: ${clinicId}`,
      );

      // Extract authorization token to forward to auth service
      const authHeader = req.headers.authorization;
      console.log(
        '🔑 [Institution Controller] Authorization header:',
        authHeader ? 'Present' : 'Missing',
      );

      const staff = await this.institutionService.getClinicStaff(
        Number(clinicId),
        authHeader,
      );

      console.log(
        '✅ [Institution Controller] Successfully fetched clinic staff',
      );
      return res.status(200).json({
        data: staff,
      });
    } catch (error) {
      console.error(
        '❌ [Institution Controller] Error in getClinicStaff:',
        error,
      );
      next(error);
    }
  }

  async getLabStaff(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      console.log('🔍 [Institution Controller] getLabStaff called');
      console.log('📝 [Institution Controller] Request params:', req.params);
      // console.log('👤 [Institution Controller] Request user:', req.user);
      console.log('🔑 [Institution Controller] Request headers:', req.headers);

      const { labId } = req.params;
      console.log(
        `🧪 [Institution Controller] Fetching staff for lab ID: ${labId}`,
      );

      // Extract authorization token to forward to auth service
      const authHeader = req.headers.authorization;
      console.log(
        '🔑 [Institution Controller] Authorization header:',
        authHeader ? 'Present' : 'Missing',
      );

      const staff = await this.institutionService.getLabStaff(
        Number(labId),
        authHeader,
      );

      console.log('✅ [Institution Controller] Successfully fetched lab staff');
      return res.status(200).json({
        data: staff,
      });
    } catch (error) {
      console.error('❌ [Institution Controller] Error in getLabStaff:', error);
      next(error);
    }
  }
}
