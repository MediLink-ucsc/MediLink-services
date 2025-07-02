import { Request, Response } from 'express';
import { z } from 'zod';
import AuthService from '../services/auth.service';

const registerSchema = z.object({
  firstName: z.string().min(3).max(50),
  lastName: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const registerPatientSchema = z.object({
  firstName: z.string().min(3).max(50),
  lastName: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  age: z.number().min(0),
  gender: z.string(),
  contactNumber: z.string(),
});

const registerDoctorSchema = z.object({
  firstName: z.string().min(3).max(50),
  lastName: z.string().min(3).max(50),
  email: z.string().email(),
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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async patientRegister(req: Request, res: Response): Promise<any> {
    const { firstName, lastName, email, password, age, gender, contactNumber } = registerPatientSchema.parse(
      req.body,
    );

    const user = await this.authService.patientRegister({
      firstName,
      lastName,
      email,
      password,
      age,
      gender,
      contactNumber,
    });

    return res.status(201).json(user);
  }

  async doctorRegister(req: Request, res: Response): Promise<any> {
  const {
    firstName,
    lastName,
    email,
    password,
    licenseNumber,
    specialty,
    yearsOfExperience,
    contactNumber,
    hospitalId,
    hospitalName,
    gender,
    dateOfBirth,
  } = registerDoctorSchema.parse(req.body);

  const doctor = await this.authService.doctorRegister({
    firstName,
    lastName,
    email,
    password,
    licenseNumber,
    specialty,
    yearsOfExperience,
    contactNumber,
    hospitalId,
    hospitalName,
    gender,
    dateOfBirth,
  });

  return res.status(201).json(doctor);
}


  async patientLogin(req: Request, res: Response): Promise<any> {
    const { email, password } = loginSchema.parse(req.body);
    const { token } = await this.authService.patientLogin(email, password);

    return res.status(200).json({ token });
  }

  async doctorLogin(req: Request, res: Response): Promise<any> {
    console.log("LOGIN BODY:", req.body);
    const { email, password } = loginSchema.parse(req.body);
    const { token } = await this.authService.doctorLogin(email, password);

    return res.status(200).json({ token });
  }

  async logout(req: Request, res: Response): Promise<any> {
    await this.authService.logout(req.userId!, req.token);

    return res.status(200).json({ message: 'logged out successfully' });
  }
}