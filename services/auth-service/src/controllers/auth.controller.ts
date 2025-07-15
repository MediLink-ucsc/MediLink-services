import { Request, Response } from 'express';
import { z } from 'zod';
import AuthService from '../services/auth.service';
import { AppDataSource } from '../data-source';
import { Doctor } from '../entity/doctor.entity';

export const registerLabAdminSchema = z.object({
  // User fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),

  // Lab fields
  institutionName: z.string().min(1, 'Institution name is required'),
  contactNumber: z.string().optional(),
  email: z.string().email('Invalid lab email').optional(),
  address: z.string().optional(),
  accreditationNumber: z.string().min(1, 'Accreditation number is required'),
  licenseExpiryDate: z.string().optional(),
  headTechnologistName: z.string().optional(),
  availableTests: z.string().optional(),
});

export const registerClinicAdminSchema = z.object({
  // User fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),

  // Clinic fields
  institutionName: z.string().min(1, 'Institution name is required'),
  contactNumber: z.string().optional(),
  email: z.string().email('Invalid clinic email').optional(),
  address: z.string().optional(),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  registrationExpiryDate: z.string().optional(),
  headPhysicianName: z.string().optional(),
  specializations: z.string().optional(),
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
  password: z.string().min(6).max(100),
  licenseNumber: z.string().min(3).max(50),
  specialty: z.string().min(3).max(100),
  yearsOfExperience: z.number().int().min(0),
  contactNumber: z.string().min(7).max(15),
  hospitalId: z.number().int().optional(),
  hospitalName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
});

const registerLabAssistantSchema = z.object({
  firstName: z.string().min(3).max(50),
  lastName: z.string().min(3).max(50),
  username: z.string().email(),
  password: z.string().min(6).max(100),
  qualification: z.string().min(2).max(100),
  department: z.string().min(2).max(100),
  yearsOfExperience: z.number().int().min(0),
  contactNumber: z.string().min(7).max(15),
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
  password: z.string().min(6).max(100),
  position: z.string().min(2).max(100),
  qualification: z.string().min(2).max(100).optional(),
  department: z.string().min(2).max(100).optional(),
  yearsOfExperience: z.number().int().min(0),
  contactNumber: z.string().min(7).max(15),
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

export class AuthController {
  private authService: AuthService;
  private doctorRepository = AppDataSource.getRepository(Doctor);

  constructor() {
    this.authService = new AuthService();
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

  async labAdminRegister(req: Request, res: Response): Promise<any> {
    const {
      firstName,
      lastName,
      username,
      password,
      institutionName,
      contactNumber,
      email,
      address,
      accreditationNumber,
      licenseExpiryDate,
      headTechnologistName,
      availableTests,
    } = registerLabAdminSchema.parse(req.body); // your Zod or Joi schema should include these

    const user = await this.authService.labAdminRegister({
      firstName,
      lastName,
      username,
      password,
      institutionName,
      contactNumber,
      email,
      address,
      accreditationNumber,
      licenseExpiryDate,
      headTechnologistName,
      availableTests,
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
      contactNumber,
      email,
      address,
      registrationNumber,
      registrationExpiryDate,
      headPhysicianName,
      specializations,
    } = registerClinicAdminSchema.parse(req.body); // your Zod or Joi schema for clinic admin

    const user = await this.authService.clinicAdminRegister({
      firstName,
      lastName,
      username,
      password,
      institutionName,
      contactNumber,
      email,
      address,
      registrationNumber,
      registrationExpiryDate,
      headPhysicianName,
      specializations,
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
    const { username, password } = loginWithRoleSchema.parse(req.body);
    const result = await this.authService.medvaultproLogin(username, password);

    return res.status(200).json(result);
  }

  async logout(req: Request, res: Response): Promise<any> {
    console.log('Req body:', req.body);
    console.log('User ID:', req.userId);
    console.log('Token:', req.token);
    await this.authService.logout(req.userId!, req.token);

    return res.status(200).json({ message: 'logged out successfully' });
  }
}
