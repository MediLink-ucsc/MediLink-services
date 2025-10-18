import { Request, Response } from 'express';
import { z } from 'zod';
import AuthService from '../services/auth.service';
import { AppDataSource } from '../data-source';
import { Doctor } from '../entity/doctor.entity';
import logger from '../config/logger';

export const registerLabAdminSchema = z.object({
  // User fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),

  // Lab fields (now aligned with clinic-style fields)
  institutionName: z.string().min(1, 'Institution name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  provinceState: z.string().min(1, 'Province/State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  emailAddress: z.string().email('Invalid email address'),
  website: z.string().url('Invalid website URL').optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  institutionLogo: z.string().optional(), // Base64 or image path
});

export const registerClinicAdminSchema = z.object({
  // User fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),

  // Clinic fields
  institutionName: z.string().min(1, 'Institution name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  provinceState: z.string().min(1, 'Province/State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  emailAddress: z.string().email('Invalid clinic email'),
  website: z.string().optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  institutionLogo: z.string().optional(), // for file name or base64/url
});

const registerPatientSchema = z.object({
  firstName: z.string().min(3).max(50),
  lastName: z.string().min(3).max(50),
  username: z.string(),
  password: z.string().min(6).max(100),
  age: z.number().min(0),
  gender: z.string(),
});

const registerDoctorSchema = z.object({
  firstName: z.string().min(3).max(50),
  lastName: z.string().min(3).max(50),
  username: z.string().email(),
  password: z.string().min(6).max(100).optional(), // Optional for admin registration
  licenseNumber: z.string().min(3).max(50),
  specialty: z.string().min(3).max(100),
  yearsOfExperience: z.number().int().min(0),
  contactNumber: z.string().min(7).max(15).optional(), // Optional field
  hospitalId: z.number().int().optional(),
  hospitalName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
});

const registerLabAssistantSchema = z.object({
  firstName: z.string().min(3).max(50),
  lastName: z.string().min(3).max(50),
  username: z.string().email(),
  password: z.string().min(6).max(100).optional(), // Optional for admin registration
  qualification: z.string().min(2).max(100),
  department: z.string().min(2).max(100),
  yearsOfExperience: z.number().int().min(0),
  contactNumber: z.string().min(7).max(15).optional(), // Optional field
  labId: z.number().int().optional(),
  labName: z.string().max(100).optional(),
  hospitalId: z.number().int().optional(),
  hospitalName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
});

const registerMedicalStaffSchema = z.object({
  firstName: z.string().min(3).max(50),
  lastName: z.string().min(3).max(50),
  username: z.string().email(),
  password: z.string().min(6).max(100).optional(), // Optional for admin registration
  position: z.string().min(2).max(100),
  qualification: z.string().min(2).max(100).optional(),
  department: z.string().min(2).max(100).optional(),
  yearsOfExperience: z.number().int().min(0),
  contactNumber: z.string().min(7).max(15).optional(), // Optional field
  hospitalId: z.number().int().optional(),
  hospitalName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const loginWithRoleSchema = z.object({
  username: z.string().email(),
  password: z.string(),
  // role: z.enum(['DOCTOR', 'LAB_ASSISTANT', 'MEDICAL_STAFF', 'ADMIN']),
});

const requestPasswordResetSchema = z.object({
  username: z.string().email('Must be a valid email address'),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const verifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export class AuthController {
  private authService: AuthService;
  private doctorRepository = AppDataSource.getRepository(Doctor);

  constructor() {
    this.authService = new AuthService();
  }

  async updatePatientLastVisited(req: Request, res: Response): Promise<any> {
    try {
      const patientId = Number(req.params.patientId);
      const { lastVisited } = req.body;

      if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
      }

      const updatedPatient = await this.authService.updateLastVisited(
        patientId,
        lastVisited,
      );

      return res.status(200).json({
        message: 'Last visited date updated',
        patient: updatedPatient,
      });
    } catch (error: any) {
      console.error(error);
      const status = error.status || 500;
      return res
        .status(status)
        .json({ message: error.message || 'Internal server error' });
    }
  }

  async updatePatientCondition(req: Request, res: Response): Promise<any> {
    try {
      const patientId = Number(req.params.patientId);
      const { condition } = req.body;

      if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
      }

      if (!condition) {
        return res.status(400).json({ message: 'Condition is required' });
      }

      const updatedPatient = await this.authService.updatePatientCondition(
        patientId,
        condition,
      );

      if (!updatedPatient) {
        return res
          .status(404)
          .json({ message: `Patient with ID ${patientId} not found` });
      }

      return res.status(200).json({
        message: 'Patient condition updated successfully',
        patient: updatedPatient,
      });
    } catch (error: any) {
      console.error(error);
      return res
        .status(500)
        .json({ message: error.message || 'Internal server error' });
    }
  }

  async getDoctorById(req: Request, res: Response): Promise<any> {
    const doctorId = req.params.doctorId;

    const doctor = await this.doctorRepository.findOne({
      where: { id: Number(doctorId) },
      relations: ['user'], // pulls linked user fields
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.status(200).json({
      id: doctor.id,
      firstName: doctor.user.firstName,
      lastName: doctor.user.lastName,
      email: doctor.user.username,
      licenseNumber: doctor.licenseNumber,
      specialty: doctor.specialty,
      yearsOfExperience: doctor.yearsOfExperience,
      hospitalId: doctor.hospitalId,
      hospitalName: doctor.hospitalName,
      gender: doctor.gender,
      dateOfBirth: doctor.dateOfBirth,
    });
  }

  async getPatients(req: Request, res: Response): Promise<any> {
    try {
      const patients = await this.authService.getPatients();

      if (!patients || patients.length === 0) {
        return res.status(404).json({ message: `No patients found` });
      }

      return res.json(patients);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getPatientByUsername(req: Request, res: Response): Promise<any> {
    try {
      const username = req.params.username;

      if (!username) {
        return res.status(400).json({ message: 'Username is required' });
      }

      const patient = await this.authService.getPatientByUsername(username);

      if (!patient) {
        return res
          .status(404)
          .json({ message: `No patient found with username ${username}` });
      }

      return res.json(patient);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getDoctorByUserid(req: Request, res: Response): Promise<any> {
    try {
      const userid = req.params.doctorUserid;

      if (!userid) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const doctor = await this.authService.getDoctorByUserid(userid);

      if (!doctor) {
        return res
          .status(404)
          .json({ message: `No doctor found with user ID ${userid}` });
      }

      return res.json(doctor);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getDoctorsByHospitalId(req: Request, res: Response): Promise<any> {
    try {
      console.log('🔍 [Auth Controller] getDoctorsByHospitalId called');
      console.log('📝 [Auth Controller] Request params:', req.params);
      // console.log('👤 [Auth Controller] Request user:', req.user);
      console.log('🔑 [Auth Controller] Request headers:', req.headers);

      const hospitalId = parseInt(req.params.hospitalId);

      if (!hospitalId || isNaN(hospitalId)) {
        console.error(
          '❌ [Auth Controller] Invalid hospital ID:',
          req.params.hospitalId,
        );
        return res
          .status(400)
          .json({ message: 'Valid hospital ID is required' });
      }

      console.log(
        `🏥 [Auth Controller] Fetching doctors for hospital ID: ${hospitalId}`,
      );
      const doctors = await this.authService.getDoctorsByHospitalId(hospitalId);
      console.log(`✅ [Auth Controller] Found ${doctors.length} doctors`);

      return res.json({ data: doctors });
    } catch (error) {
      console.error(
        '❌ [Auth Controller] Error in getDoctorsByHospitalId:',
        error,
      );
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getMedicalStaffByHospitalId(req: Request, res: Response): Promise<any> {
    try {
      console.log('🔍 [Auth Controller] getMedicalStaffByHospitalId called');
      console.log('📝 [Auth Controller] Request params:', req.params);
      // console.log('👤 [Auth Controller] Request user:', req.user);
      console.log('🔑 [Auth Controller] Request headers:', req.headers);

      const hospitalId = parseInt(req.params.hospitalId);

      if (!hospitalId || isNaN(hospitalId)) {
        console.error(
          '❌ [Auth Controller] Invalid hospital ID:',
          req.params.hospitalId,
        );
        return res
          .status(400)
          .json({ message: 'Valid hospital ID is required' });
      }

      console.log(
        `🏥 [Auth Controller] Fetching medical staff for hospital ID: ${hospitalId}`,
      );
      const medicalStaff =
        await this.authService.getMedicalStaffByHospitalId(hospitalId);
      console.log(
        `✅ [Auth Controller] Found ${medicalStaff.length} medical staff`,
      );

      return res.json({ data: medicalStaff });
    } catch (error) {
      console.error(
        '❌ [Auth Controller] Error in getMedicalStaffByHospitalId:',
        error,
      );
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getLabAssistantsByLabId(req: Request, res: Response): Promise<any> {
    try {
      console.log('🔍 [Auth Controller] getLabAssistantsByLabId called');
      console.log('📝 [Auth Controller] Request params:', req.params);
      // console.log('👤 [Auth Controller] Request user:', req.user);
      console.log('🔑 [Auth Controller] Request headers:', req.headers);

      const labId = parseInt(req.params.labId);

      if (!labId || isNaN(labId)) {
        console.error('❌ [Auth Controller] Invalid lab ID:', req.params.labId);
        return res.status(400).json({ message: 'Valid lab ID is required' });
      }

      console.log(
        `🧪 [Auth Controller] Fetching lab assistants for lab ID: ${labId}`,
      );
      const labAssistants =
        await this.authService.getLabAssistantsByLabId(labId);
      console.log(
        `✅ [Auth Controller] Found ${labAssistants.length} lab assistants`,
      );

      return res.json({ data: labAssistants });
    } catch (error) {
      console.error(
        '❌ [Auth Controller] Error in getLabAssistantsByLabId:',
        error,
      );
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async labAdminRegister(req: Request, res: Response): Promise<any> {
    const {
      firstName,
      lastName,
      username,
      password,
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
    } = registerLabAdminSchema.parse(req.body); // Validated via Zod or Joi

    const user = await this.authService.labAdminRegister({
      firstName,
      lastName,
      username,
      password,
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
    });

    return res.status(201).json(user);
  }

  async clinicAdminRegister(req: Request, res: Response): Promise<any> {
    const {
      firstName,
      lastName,
      username,
      password,
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
    } = registerClinicAdminSchema.parse(req.body); // Validated via Zod/Joi

    const user = await this.authService.clinicAdminRegister({
      firstName,
      lastName,
      username,
      password,
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
    });

    return res.status(201).json(user);
  }

  async patientRegister(req: Request, res: Response): Promise<any> {
    const { firstName, lastName, username, password, age, gender } =
      registerPatientSchema.parse(req.body);

    const user = await this.authService.patientRegister({
      firstName,
      lastName,
      username,
      password,
      age,
      gender,
    });

    return res.status(201).json(user);
  }

  async doctorRegister(req: Request, res: Response): Promise<any> {
    const {
      firstName,
      lastName,
      username,
      password,
      licenseNumber,
      specialty,
      yearsOfExperience,
      hospitalId,
      hospitalName,
      gender,
      dateOfBirth,
    } = registerDoctorSchema.parse(req.body);

    const doctor = await this.authService.doctorRegister({
      firstName,
      lastName,
      username,
      password,
      licenseNumber,
      specialty,
      yearsOfExperience,
      hospitalId,
      hospitalName,
      gender,
      dateOfBirth,
    });

    return res.status(201).json(doctor);
  }

  async labAssistantRegister(req: Request, res: Response): Promise<any> {
    const {
      firstName,
      lastName,
      username,
      password,
      qualification,
      department,
      yearsOfExperience,
      labId,
      labName,
      hospitalId,
      hospitalName,
      gender,
      dateOfBirth,
    } = registerLabAssistantSchema.parse(req.body);

    const user = await this.authService.labAssistantRegister({
      firstName,
      lastName,
      username,
      password,
      qualification,
      department,
      yearsOfExperience,
      labId,
      labName,
      hospitalId,
      hospitalName,
      gender,
      dateOfBirth,
    });

    return res.status(201).json(user);
  }

  async medicalStaffRegister(req: Request, res: Response): Promise<any> {
    const {
      firstName,
      lastName,
      username,
      password,
      position,
      qualification,
      department,
      yearsOfExperience,
      hospitalId,
      hospitalName,
      gender,
      dateOfBirth,
    } = registerMedicalStaffSchema.parse(req.body);

    const medicalStaff = await this.authService.medicalStaffRegister({
      firstName,
      lastName,
      username,
      password,
      position,
      qualification,
      department,
      yearsOfExperience,
      hospitalId,
      hospitalName,
      gender,
      dateOfBirth,
    });

    return res.status(201).json(medicalStaff);
  }

  async patientLogin(req: Request, res: Response): Promise<any> {
    const { username, password } = loginSchema.parse(req.body);
    const { token } = await this.authService.patientLogin(username, password);

    return res.status(200).json({ token });
  }

  async medvaultproLogin(req: Request, res: Response): Promise<any> {
    const { username, password } = loginSchema.parse(req.body);
    console.log(req.body);
    const result = await this.authService.medvaultproLogin(username, password);

    return res.status(200).json(result);
  }

  async requestPasswordReset(req: Request, res: Response): Promise<any> {
    try {
      const { username } = requestPasswordResetSchema.parse(req.body);
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

      await this.authService.requestPasswordReset(username, clientIp);

      // Always return success for security (don't reveal if user exists)
      return res.status(200).json({
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error: any) {
      logger.error('Request password reset error:', {
        error: error.message,
        username: req.body.username,
        ip: req.ip,
      });

      if (error.issues) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        });
      }

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to process password reset request',
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<any> {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

      await this.authService.resetPassword(token, newPassword, clientIp);

      return res.status(200).json({
        success: true,
        message:
          'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error: any) {
      logger.error('Reset password error:', {
        error: error.message,
        token: req.body.token?.substring(0, 8) + '...',
        ip: req.ip,
      });

      if (error.issues) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        });
      }

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  }

  async verifyResetToken(req: Request, res: Response): Promise<any> {
    try {
      const { token } = verifyResetTokenSchema.parse(req.body);

      const result = await this.authService.verifyPasswordResetToken(token);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: result.user,
        },
      });
    } catch (error: any) {
      logger.error('Verify reset token error:', {
        error: error.message,
        token: req.body.token?.substring(0, 8) + '...',
      });

      if (error.issues) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to verify reset token',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<any> {
    console.log('Req body:', req.body);
    console.log('User ID:', req.userId);
    console.log('Token:', req.token);
    await this.authService.logout(req.userId!, req.token);

    return res.status(200).json({ message: 'logged out successfully' });
  }
}
