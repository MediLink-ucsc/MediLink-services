import jwt from 'jsonwebtoken';
import ms from 'ms';
import bcrypt from 'bcrypt';
import axios from 'axios';
import crypto from 'crypto';
import { AppDataSource } from '../data-source';
import { config } from '../config';
import redis from '../config/redis';
import { Repository } from 'typeorm';
import { Credential } from '../entity/credential.entity';
import { User } from '../entity/user.entity';
import { Patient } from '../entity/patient.entity';
import { Doctor } from '../entity/doctor.entity';
import { LabAssistant } from '../entity/labAssistant.entity';
import { MedicalStaff } from '../entity/medicalStaff.entity';
import { PasswordResetToken } from '../entity/passwordResetToken.entity';
import { createError, generateRandomPassword } from '../utils';
import { publishUserRegistered } from '../events/producers/userRegistered.producer';
import { notificationService } from './notification.service';
import logger from '../config/logger';

interface RegisterLabAdminDto {
  firstName: string;
  lastName: string;
  username: string;
  password: string;

  institutionName: string;
  address: string;
  city: string;
  provinceState: string;
  postalCode: string;
  phoneNumber: string;
  emailAddress: string;
  website?: string;
  licenseNumber: string;
  institutionLogo?: string;
}

export interface RegisterClinicAdminDto {
  firstName: string;
  lastName: string;
  username: string;
  password: string;

  institutionName: string;
  address: string;
  city: string;
  provinceState: string;
  postalCode: string;
  phoneNumber: string;
  emailAddress: string;
  website?: string;
  licenseNumber: string;
  institutionLogo?: string;
}

interface RegisterPatientDto {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  age: number;
  gender: string;
}

interface RegisterDoctorDto {
  firstName: string;
  lastName: string;
  username: string;
  password?: string; // Optional - will be auto-generated if not provided

  licenseNumber: string;
  specialty: string;
  yearsOfExperience: number;

  hospitalId?: number;
  hospitalName?: string;
  gender?: string;
  dateOfBirth?: string;
  contactNo?: string;
}

interface RegisterLabAssistantDto {
  firstName: string;
  lastName: string;
  username: string;
  password?: string; // Optional - will be auto-generated if not provided

  qualification: string;
  department: string;
  yearsOfExperience: number;

  labId?: number;
  labName?: string;
  hospitalId?: number;
  hospitalName?: string;
  gender?: string;
  dateOfBirth?: string;
  contactNo?: string;
}

interface RegisterMedicalStaffDto {
  firstName: string;
  lastName: string;
  username: string;
  password?: string; // Optional - will be auto-generated if not provided

  position: string;
  qualification?: string;
  department?: string;
  yearsOfExperience: number;

  hospitalId?: number;
  hospitalName?: string;
  gender?: string;
  dateOfBirth?: string;
  contactNo?: string;
}

class AuthService {
  credentialRepository: Repository<Credential>;
  userRepository: Repository<User>;
  patientRepository: Repository<Patient>;
  doctorRepository: Repository<Doctor>;
  labAssistantRepository: Repository<LabAssistant>;
  medicalStaffRepository: Repository<MedicalStaff>;
  passwordResetTokenRepository: Repository<PasswordResetToken>;

  constructor() {
    this.credentialRepository = AppDataSource.getRepository(Credential);
    this.userRepository = AppDataSource.getRepository(User);
    this.patientRepository = AppDataSource.getRepository(Patient);
    this.doctorRepository = AppDataSource.getRepository(Doctor);
    this.labAssistantRepository = AppDataSource.getRepository(LabAssistant);
    this.medicalStaffRepository = AppDataSource.getRepository(MedicalStaff);
    this.passwordResetTokenRepository =
      AppDataSource.getRepository(PasswordResetToken);
  }

  async updateLastVisited(
    patientId: number,
    lastVisited?: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw createError(`Patient with ID ${patientId} not found`, 404);
    }

    patient.lastVisited = lastVisited || new Date().toISOString();

    return this.patientRepository.save(patient);
  }

  //  async getDoctorsByHospitalId(hospitalId: number): Promise<Doctor[]> {
  //     if (!hospitalId) return [];

  //     const doctors = await this.doctorRepository.find({
  //       where: { hospitalId },
  //       relations: ['user'], // include User entity
  //     });

  //     return doctors;
  //   }

  async getPatients(): Promise<any[]> {
    const patients = await this.patientRepository.find({
      relations: ['user'], // correct relation
    });

    if (!patients || patients.length === 0) {
      return []; // return empty array
    }

    return patients.map((patient) => ({
      patientId: patient.id,
      age: patient.age,
      gender: patient.gender,
      lastVisited: patient.lastVisited,
      condition: patient.condition,
      user: {
        id: patient.user.id,
        firstName: patient.user.firstName,
        lastName: patient.user.lastName,
        username: patient.user.username,
      },
    }));
  }

  async updatePatientCondition(
    patientId: number,
    condition: string,
  ): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      return null;
    }

    // Optional: validate condition against allowed enum values
    const allowedConditions = [
      'Not Updated',
      'Stable',
      'Critical',
      'Serious',
      'Fair',
      'Good',
      'Recovering',
      'Under Observation',
      'Intensive Care',
      'Emergency',
    ];

    if (!allowedConditions.includes(condition)) {
      throw new Error(
        `Invalid condition. Allowed values: ${allowedConditions.join(', ')}`,
      );
    }

    patient.condition = condition;
    return this.patientRepository.save(patient);
  }

  async getPatientByUsername(username: string): Promise<any | null> {
    const patient = await this.patientRepository.findOne({
      where: { user: { username } }, // filtering by username inside related user
      relations: ['user'], // include related user details
    });

    if (!patient) {
      return null; // return null if not found
    }

    return {
      patientId: patient.id,
      age: patient.age,
      gender: patient.gender,
      user: {
        id: patient.user.id,
        firstName: patient.user.firstName,
        lastName: patient.user.lastName,
        username: patient.user.username,
      },
    };
  }

  async getDoctorByUserid(userid: string): Promise<any> {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: parseInt(userid) } }, // match by user ID
      relations: ['user'], // include related user details
    });

    if (!doctor) {
      return null; // return null if not found
    }

    return {
      doctorId: doctor.id,
      licenseNumber: doctor.licenseNumber,
      specialty: doctor.specialty,
      yearsOfExperience: doctor.yearsOfExperience,
      hospitalId: doctor.hospitalId,
      hospitalName: doctor.hospitalName,
      gender: doctor.gender,
      dateOfBirth: doctor.dateOfBirth,
      contactNo: doctor.contactNo,
      user: {
        id: doctor.user.id,
        firstName: doctor.user.firstName,
        lastName: doctor.user.lastName,
        username: doctor.user.username,
      },
    };
  }

  async getDoctorsByHospitalId(hospitalId: number): Promise<any[]> {
    console.log(
      `🔍 [Auth Service] getDoctorsByHospitalId called for hospital ID: ${hospitalId}`,
    );

    const doctors = await this.doctorRepository.find({
      where: { hospitalId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    console.log(
      `✅ [Auth Service] Found ${doctors.length} doctors for hospital ID: ${hospitalId}`,
    );

    return doctors.map((doctor) => ({
      doctorId: doctor.id,
      licenseNumber: doctor.licenseNumber,
      specialty: doctor.specialty,
      yearsOfExperience: doctor.yearsOfExperience,
      hospitalId: doctor.hospitalId,
      hospitalName: doctor.hospitalName,
      gender: doctor.gender,
      dateOfBirth: doctor.dateOfBirth,
      contactNo: doctor.contactNo,
      user: {
        id: doctor.user.id,
        firstName: doctor.user.firstName,
        lastName: doctor.user.lastName,
        username: doctor.user.username,
      },
      createdAt: doctor.createdAt,
    }));
  }

  async getMedicalStaffByHospitalId(hospitalId: number): Promise<any[]> {
    console.log(
      `🔍 [Auth Service] getMedicalStaffByHospitalId called for hospital ID: ${hospitalId}`,
    );

    const medicalStaff = await this.medicalStaffRepository.find({
      where: { hospitalId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    console.log(
      `✅ [Auth Service] Found ${medicalStaff.length} medical staff for hospital ID: ${hospitalId}`,
    );

    return medicalStaff.map((staff) => ({
      staffId: staff.id,
      position: staff.position,
      qualification: staff.qualification,
      department: staff.department,
      yearsOfExperience: staff.yearsOfExperience,
      hospitalId: staff.hospitalId,
      hospitalName: staff.hospitalName,
      gender: staff.gender,
      dateOfBirth: staff.dateOfBirth,
      contactNo: staff.contactNo,
      user: {
        id: staff.user.id,
        firstName: staff.user.firstName,
        lastName: staff.user.lastName,
        username: staff.user.username,
      },
      createdAt: staff.createdAt,
    }));
  }

  async getLabAssistantsByLabId(labId: number): Promise<any[]> {
    console.log(
      `🔍 [Auth Service] getLabAssistantsByLabId called for lab ID: ${labId}`,
    );

    const labAssistants = await this.labAssistantRepository.find({
      where: { labId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    console.log(
      `✅ [Auth Service] Found ${labAssistants.length} lab assistants for lab ID: ${labId}`,
    );

    return labAssistants.map((assistant) => ({
      assistantId: assistant.id,
      qualification: assistant.qualification,
      department: assistant.department,
      yearsOfExperience: assistant.yearsOfExperience,
      labId: assistant.labId,
      labName: assistant.labName,
      gender: assistant.gender,
      dateOfBirth: assistant.dateOfBirth,
      contactNo: assistant.contactNo,
      user: {
        id: assistant.user.id,
        firstName: assistant.user.firstName,
        lastName: assistant.user.lastName,
        username: assistant.user.username,
      },
      createdAt: assistant.createdAt,
    }));
  }

  async labAdminRegister({
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
  }: RegisterLabAdminDto) {
    // Check if username exists
    const existing = await this.credentialRepository.findOneBy({ username });
    if (existing) {
      throw createError('username already in use', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with role 'LAB_ADMIN'
    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.role = 'LAB_ADMIN';

    await this.userRepository.save(user);

    // Create credentials
    const credential = new Credential();
    credential.username = username;
    credential.passwordHash = passwordHash;
    credential.user = user;

    await this.credentialRepository.save(credential);

    // Register lab institution with matching fields
    await axios.post('http://localhost:3000/api/v1/institutions/lab/register', {
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
      adminUserId: user.id,
    });

    // Publish user registered event
    await publishUserRegistered({
      key: user.id?.toString(),
      value: user,
    });

    // Send welcome email
    try {
      await notificationService.sendWelcomeEmail({
        email: username,
        userName: `${firstName} ${lastName}`,
      });
      logger.info('Welcome email sent to lab admin', {
        userId: user.id,
        email: username,
      });
    } catch (emailError) {
      logger.warn('Failed to send welcome email to lab admin', {
        error: (emailError as Error).message,
        userId: user.id,
        email: username,
      });
      // Don't fail registration if email fails
    }

    return { message: 'Lab admin and lab institution registered successfully' };
  }

  async clinicAdminRegister({
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
  }: RegisterClinicAdminDto) {
    // 1. Check if username exists
    const existing = await this.credentialRepository.findOneBy({ username });
    if (existing) {
      throw createError('username already in use', 400);
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create user with role 'CLINIC_ADMIN'
    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.role = 'ADMIN';

    await this.userRepository.save(user);

    // 4. Create credentials linked to user
    const credential = new Credential();
    credential.username = username;
    credential.passwordHash = passwordHash;
    credential.user = user;

    await this.credentialRepository.save(credential);

    // 5. Register the clinic using updated fields
    await axios.post(
      'http://localhost:3000/api/v1/institutions/clinic/register',
      {
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
        adminUserId: user.id, //link clinic to admin
      },
    );

    await publishUserRegistered({
      key: user.id?.toString(),
      value: user,
    });

    // Send welcome email
    try {
      await notificationService.sendWelcomeEmail({
        email: username,
        userName: `${firstName} ${lastName}`,
      });
      logger.info('Welcome email sent to clinic admin', {
        userId: user.id,
        email: username,
      });
    } catch (emailError) {
      logger.warn('Failed to send welcome email to clinic admin', {
        error: (emailError as Error).message,
        userId: user.id,
        email: username,
      });
      // Don't fail registration if email fails
    }

    return {
      message: 'Clinic admin and clinic institution registered successfully',
    };
  }

  async patientRegister({
    firstName,
    lastName,
    username,
    password,
    age,
    gender,
  }: RegisterPatientDto) {
    const existing = await this.credentialRepository.findOneBy({ username });

    if (existing) {
      throw createError('contact number already in use', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.role = 'PATIENT';

    await this.userRepository.save(user);

    const credential = new Credential();
    credential.username = username;
    credential.passwordHash = passwordHash;
    credential.user = user;

    await this.credentialRepository.save(credential);

    const patient = new Patient();
    patient.user = user;
    patient.age = age;
    patient.gender = gender;

    await this.patientRepository.save(patient);

    await publishUserRegistered({
      key: user.id?.toString(),
      value: user,
    });

    // Send welcome email
    try {
      await notificationService.sendWelcomeEmail({
        email: username,
        userName: `${firstName} ${lastName}`,
      });
    } catch (emailError) {
      // Don't fail registration if welcome email fails
      logger.warn('Failed to send welcome email for patient registration', {
        error: (emailError as Error).message,
        userId: user.id,
        username,
      });
    }

    return user;
  }

  async doctorRegister({
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
    contactNo,
  }: RegisterDoctorDto) {
    const existing = await this.credentialRepository.findOneBy({ username });
    if (existing) {
      throw createError('email already in use', 400);
    }

    // Generate random password if not provided (admin registration)
    const isAdminRegistration = !password;
    const actualPassword = password || generateRandomPassword(12);
    const passwordHash = await bcrypt.hash(actualPassword, 10);

    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.role = 'DOCTOR';

    await this.userRepository.save(user);

    const credential = new Credential();
    credential.username = username;
    credential.passwordHash = passwordHash;
    credential.user = user;

    await this.credentialRepository.save(credential);

    const doctor = new Doctor();
    doctor.user = user;
    doctor.licenseNumber = licenseNumber;
    doctor.specialty = specialty;
    doctor.yearsOfExperience = yearsOfExperience;
    if (hospitalId !== undefined) {
      doctor.hospitalId = hospitalId;
    }
    doctor.hospitalName = hospitalName ?? '';
    doctor.gender = gender ?? '';
    if (dateOfBirth) {
      doctor.dateOfBirth = new Date(dateOfBirth);
    }
    if (contactNo) doctor.contactNo = contactNo;

    await this.doctorRepository.save(doctor);

    await publishUserRegistered({
      key: user.id?.toString(),
      value: { ...user, doctor },
    });

    // Send appropriate welcome email
    try {
      if (isAdminRegistration) {
        // Send welcome email with temporary password
        await notificationService.sendWelcomeEmailWithPassword({
          email: username,
          userName: `${firstName} ${lastName}`,
          temporaryPassword: actualPassword,
          userRole: 'Doctor',
        });
        logger.info('Welcome email with password sent to doctor', {
          userId: user.id,
          email: username,
        });
      } else {
        // Send regular welcome email (self-registration scenario)
        await notificationService.sendWelcomeEmail({
          email: username,
          userName: `${firstName} ${lastName}`,
        });
        logger.info('Welcome email sent to doctor', {
          userId: user.id,
          email: username,
        });
      }
    } catch (emailError) {
      logger.warn('Failed to send welcome email to doctor', {
        error: (emailError as Error).message,
        userId: user.id,
        email: username,
      });
      // Don't fail registration if email fails
    }

    return user;
  }

  async labAssistantRegister({
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
    contactNo,
  }: RegisterLabAssistantDto) {
    const existing = await this.credentialRepository.findOneBy({ username });

    if (existing) {
      throw createError('email already in use', 400);
    }

    // Generate random password if not provided (admin registration)
    const isAdminRegistration = !password;
    const actualPassword = password || generateRandomPassword(12);
    const passwordHash = await bcrypt.hash(actualPassword, 10);

    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.role = 'LAB_ASSISTANT';

    await this.userRepository.save(user);

    const credential = new Credential();
    credential.username = username;
    credential.passwordHash = passwordHash;
    credential.user = user;

    await this.credentialRepository.save(credential);

    const labAssistant = new LabAssistant();
    labAssistant.user = user;
    labAssistant.qualification = qualification;
    labAssistant.department = department;
    labAssistant.yearsOfExperience = yearsOfExperience;
    if (labId !== undefined) {
      labAssistant.labId = labId;
    }
    labAssistant.labName = labName ?? '';
    labAssistant.hospitalId = hospitalId ?? 0;
    labAssistant.hospitalName = hospitalName ?? '';
    labAssistant.gender = gender ?? '';
    labAssistant.dateOfBirth = dateOfBirth
      ? new Date(dateOfBirth)
      : new Date(0);
    if (contactNo) labAssistant.contactNo = contactNo;

    await this.labAssistantRepository.save(labAssistant);

    await publishUserRegistered({
      key: user.id?.toString(),
      value: { ...user, labAssistant },
    });

    // Send appropriate welcome email
    try {
      if (isAdminRegistration) {
        // Send welcome email with temporary password
        await notificationService.sendWelcomeEmailWithPassword({
          email: username,
          userName: `${firstName} ${lastName}`,
          temporaryPassword: actualPassword,
          userRole: 'Lab Assistant',
        });
        logger.info('Welcome email with password sent to lab assistant', {
          userId: user.id,
          email: username,
        });
      } else {
        // Send regular welcome email (self-registration scenario)
        await notificationService.sendWelcomeEmail({
          email: username,
          userName: `${firstName} ${lastName}`,
        });
        logger.info('Welcome email sent to lab assistant', {
          userId: user.id,
          email: username,
        });
      }
    } catch (emailError) {
      logger.warn('Failed to send welcome email to lab assistant', {
        error: (emailError as Error).message,
        userId: user.id,
        email: username,
      });
      // Don't fail registration if email fails
    }

    return user;
  }

  async medicalStaffRegister({
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
    contactNo,
  }: RegisterMedicalStaffDto) {
    const existing = await this.credentialRepository.findOneBy({ username });

    if (existing) {
      throw createError('email already in use', 400);
    }

    // Generate random password if not provided (admin registration)
    const isAdminRegistration = !password;
    const actualPassword = password || generateRandomPassword(12);
    const passwordHash = await bcrypt.hash(actualPassword, 10);

    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.role = 'MEDICAL_STAFF';

    await this.userRepository.save(user);

    const credential = new Credential();
    credential.username = username;
    credential.passwordHash = passwordHash;
    credential.user = user;

    await this.credentialRepository.save(credential);

    const medicalStaff = new MedicalStaff();
    medicalStaff.user = user;
    medicalStaff.position = position;
    medicalStaff.qualification = qualification ?? '';
    medicalStaff.department = department ?? '';
    medicalStaff.yearsOfExperience = yearsOfExperience;
    medicalStaff.hospitalId = hospitalId ?? 0;
    medicalStaff.hospitalName = hospitalName ?? '';
    medicalStaff.gender = gender ?? '';
    medicalStaff.dateOfBirth = dateOfBirth
      ? new Date(dateOfBirth)
      : new Date(0);
    if (contactNo) medicalStaff.contactNo = contactNo;

    await this.medicalStaffRepository.save(medicalStaff);

    await publishUserRegistered({
      key: user.id?.toString(),
      value: { ...user, medicalStaff },
    });

    // Send appropriate welcome email
    try {
      if (isAdminRegistration) {
        // Send welcome email with temporary password
        await notificationService.sendWelcomeEmailWithPassword({
          email: username,
          userName: `${firstName} ${lastName}`,
          temporaryPassword: actualPassword,
          userRole: 'Medical Staff',
        });
        logger.info('Welcome email with password sent to medical staff', {
          userId: user.id,
          email: username,
        });
      } else {
        // Send regular welcome email (self-registration scenario)
        await notificationService.sendWelcomeEmail({
          email: username,
          userName: `${firstName} ${lastName}`,
        });
        logger.info('Welcome email sent to medical staff', {
          userId: user.id,
          email: username,
        });
      }
    } catch (emailError) {
      logger.warn('Failed to send welcome email to medical staff', {
        error: (emailError as Error).message,
        userId: user.id,
        email: username,
      });
      // Don't fail registration if email fails
    }

    return user;
  }

  async patientLogin(username: string, password: string) {
    const credential = await this.credentialRepository.findOne({
      where: { username },
      relations: ['user'],
    });

    if (!credential) {
      throw createError('invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(
      password,
      credential.passwordHash,
    );

    if (!isValidPassword) {
      throw createError('invalid credentials', 401);
    }

    if (credential.user.role !== 'PATIENT') {
      throw createError('not authorized as patient', 403);
    }

    const token = jwt.sign(
      {
        id: credential.user.id,
        username: credential.username,
        firstName: credential.user.firstName,
        lastName: credential.user.lastName,
        role: credential.user.role,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as ms.StringValue },
    );

    await redis.setex(
      `auth:${credential.user.id}:${token}`,
      24 * 60 * 60,
      'true',
    );

    return {
      token,
      firstName: credential.user.firstName,
      lastName: credential.user.lastName,
      username: credential.username,
      role: credential.user.role,
    };
  }
  //   async medvaultproLogin(username: string, password: string, role: string) {
  //   const credential = await this.credentialRepository.findOne({
  //     where: { username },
  //     relations: ['user'],
  //   });

  //   if (!credential) {
  //     throw createError('invalid credentials', 401);
  //   }

  //   const isValidPassword = await bcrypt.compare(
  //     password,
  //     credential.passwordHash,
  //   );

  //   if (!isValidPassword) {
  //     throw createError('invalid credentials', 401);
  //   }

  //   if (credential.user.role !== role) {
  //     throw createError(`not authorized as ${role.toLowerCase()}`, 403);
  //   }

  //   let hospitalId: number | null = null;

  //   if (role === 'DOCTOR') {
  //     const doctor = await this.doctorRepository.findOne({
  //       where: { user: { id: credential.user.id } },
  //     });
  //     hospitalId = doctor?.hospitalId ?? null;
  //   }

  //   if (role === 'LAB_ASSISTANT') {
  //     const labAssistant = await this.labAssistantRepository.findOne({
  //       where: { user: { id: credential.user.id } },
  //     });
  //     hospitalId = labAssistant?.hospitalId ?? null;
  //   }

  //   if (role === 'MEDICAL_STAFF') {
  //     const medicalStaff = await this.medicalStaffRepository.findOne({
  //       where: { user: { id: credential.user.id } },
  //     });
  //     hospitalId = medicalStaff?.hospitalId ?? null;
  //   }

  //   if (role === 'ADMIN') {
  //     hospitalId = null;
  //   }

  //   const token = jwt.sign(
  //     {
  //       id: credential.user.id,
  //       username: credential.username,
  //       firstName: credential.user.firstName,
  //       lastName: credential.user.lastName,
  //       role: credential.user.role,
  //       hospitalId: hospitalId,
  //     },
  //     config.JWT_SECRET,
  //     { expiresIn: config.JWT_EXPIRES_IN as ms.StringValue },
  //   );

  //   await redis.setex(
  //     `auth:${credential.user.id}:${token}`,
  //     24 * 60 * 60,
  //     'true',
  //   );

  //   return {
  //     token,
  //     firstName: credential.user.firstName,
  //     lastName: credential.user.lastName,
  //     username: credential.username,
  //     role: credential.user.role,
  //     hospitalId,
  //   };
  // }

  async medvaultproLogin(username: string, password: string) {
    console.log('medvaultproLogin called with:', { username, password });
    const credential = await this.credentialRepository.findOne({
      where: { username },
      relations: ['user'],
    });

    if (!credential) {
      throw createError('invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(
      password,
      credential.passwordHash,
    );

    if (!isValidPassword) {
      throw createError('invalid credentials', 401);
    }

    const role = credential.user.role; // get role directly from DB

    let hospitalId: number | null = null;

    if (role === 'DOCTOR') {
      const doctor = await this.doctorRepository.findOne({
        where: { user: { id: credential.user.id } },
      });
      hospitalId = doctor?.hospitalId ?? null;
    }

    if (role === 'LAB_ASSISTANT') {
      const labAssistant = await this.labAssistantRepository.findOne({
        where: { user: { id: credential.user.id } },
      });
      hospitalId = labAssistant?.hospitalId ?? null;
    }

    if (role === 'MEDICAL_STAFF') {
      const medicalStaff = await this.medicalStaffRepository.findOne({
        where: { user: { id: credential.user.id } },
      });
      hospitalId = medicalStaff?.hospitalId ?? null;
    }

    if (role === 'ADMIN' || role === 'LAB_ADMIN') {
      // Check both clinic and lab tables for admin user
      try {
        console.log(
          `🔍 [Auth Service] Looking up institution for admin user ID: ${credential.user.id}`,
        );

        const response = await axios.get<{
          data: { type: 'clinic' | 'lab'; id: number };
        }>(
          `http://localhost:3000/api/v1/institutions/admin/${credential.user.id}/institution`,
        );

        if (response.data && response.data.data) {
          const institution = response.data.data;
          hospitalId = institution.id;
          console.log(
            `✅ [Auth Service] Admin user ${credential.user.id} found as ${institution.type} admin with hospitalId: ${hospitalId}`,
          );
        } else {
          console.log(
            `⚠️ [Auth Service] Admin user ${credential.user.id} not found in any institution`,
          );
          hospitalId = null;
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log(
            `⚠️ [Auth Service] Admin user ${credential.user.id} not found in any institution`,
          );
        } else {
          console.error(
            '❌ [Auth Service] Failed to fetch institution data for admin:',
            error.message,
          );
        }
        hospitalId = null;
      }
    }

    const token = jwt.sign(
      {
        id: credential.user.id,
        username: credential.username,
        firstName: credential.user.firstName,
        lastName: credential.user.lastName,
        role,
        hospitalId,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as ms.StringValue },
    );

    await redis.setex(
      `auth:${credential.user.id}:${token}`,
      24 * 60 * 60,
      'true',
    );

    return {
      token,
      username: credential.username,
      firstName: credential.user.firstName,
      lastName: credential.user.lastName,
      role,
      hospitalId,
    };
  }

  async requestPasswordReset(
    username: string,
    requestIp?: string,
  ): Promise<void> {
    try {
      // Find user by username (could be email or username)
      const credential = await this.credentialRepository.findOne({
        where: { username },
        relations: ['user'],
      });

      if (!credential) {
        // Don't reveal if user exists or not for security
        logger.warn('Password reset requested for non-existent user', {
          username,
          requestIp,
        });
        return;
      }

      const user = credential.user;

      // Invalidate any existing password reset tokens for this user
      await this.passwordResetTokenRepository.update(
        { userId: user.id, isUsed: false },
        { isUsed: true, usedAt: new Date() },
      );

      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Calculate expiry time (default 15 minutes)
      const expiryMinutes =
        parseInt(config.PASSWORD_RESET_EXPIRY.replace(/\D/g, '')) || 15;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Save password reset token
      const passwordResetToken = this.passwordResetTokenRepository.create({
        token: resetToken,
        userId: user.id,
        user,
        expiresAt,
        requestIp,
      });

      await this.passwordResetTokenRepository.save(passwordResetToken);

      // Send password reset email via notification service
      try {
        await notificationService.sendPasswordResetEmail({
          email: username, // Assuming username is email
          resetToken,
          userName: `${user.firstName} ${user.lastName}`,
        });

        logger.info('Password reset email sent successfully', {
          userId: user.id,
          username,
          tokenId: passwordResetToken.id,
        });
      } catch (emailError: any) {
        logger.error('Failed to send password reset email', {
          error: emailError.message,
          userId: user.id,
          username,
        });

        // Delete the token if email sending failed
        await this.passwordResetTokenRepository.delete(passwordResetToken.id);
        throw createError(
          'Failed to send password reset email. Please try again later.',
          500,
        );
      }
    } catch (error: any) {
      logger.error('Error in requestPasswordReset', {
        error: error.message,
        username,
        requestIp,
      });

      if (error.statusCode) {
        throw error; // Re-throw known errors
      }

      throw createError('Failed to process password reset request', 500);
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
    requestIp?: string,
  ): Promise<void> {
    try {
      // Find valid password reset token
      const passwordResetToken =
        await this.passwordResetTokenRepository.findOne({
          where: {
            token,
            isUsed: false,
          },
          relations: ['user'],
        });

      if (!passwordResetToken) {
        throw createError('Invalid or expired password reset token', 400);
      }

      // Check if token is expired
      if (new Date() > passwordResetToken.expiresAt) {
        // Mark token as used
        passwordResetToken.isUsed = true;
        passwordResetToken.usedAt = new Date();
        await this.passwordResetTokenRepository.save(passwordResetToken);

        throw createError('Password reset token has expired', 400);
      }

      const user = passwordResetToken.user;

      // Validate new password (you can add more validation here)
      if (!newPassword || newPassword.length < 6) {
        throw createError('Password must be at least 6 characters long', 400);
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      await this.credentialRepository.update(
        { user: { id: user.id } },
        { passwordHash },
      );

      // Mark token as used
      passwordResetToken.isUsed = true;
      passwordResetToken.usedAt = new Date();
      await this.passwordResetTokenRepository.save(passwordResetToken);

      // Invalidate all active sessions for security
      const activeTokens = await redis.keys(`auth:${user.id}:*`);
      if (activeTokens.length > 0) {
        await redis.del(...activeTokens);
      }

      logger.info('Password reset completed successfully', {
        userId: user.id,
        username: user.username,
        tokenId: passwordResetToken.id,
        requestIp,
      });

      // Optionally send confirmation email
      try {
        await notificationService.sendEmail({
          to: passwordResetToken.user.username, // Assuming username is email
          toName: `${user.firstName} ${user.lastName}`,
          subject: 'Password Reset Successful',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Successful</h2>
              <p>Hello ${user.firstName},</p>
              <p>Your password has been successfully reset for your MediLink account.</p>
              <p>If you did not make this change, please contact our support team immediately.</p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                MediLink Support Team<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          `,
          emailType: 'password_reset',
          userId: user.id.toString(),
        });
      } catch (emailError) {
        // Don't fail the password reset if confirmation email fails
        logger.warn('Failed to send password reset confirmation email', {
          error: (emailError as Error).message,
          userId: user.id,
        });
      }
    } catch (error: any) {
      logger.error('Error in resetPassword', {
        error: error.message,
        token: token.substring(0, 8) + '...', // Log partial token for debugging
        requestIp,
      });

      if (error.statusCode) {
        throw error; // Re-throw known errors
      }

      throw createError('Failed to reset password', 500);
    }
  }

  async verifyPasswordResetToken(
    token: string,
  ): Promise<{ valid: boolean; user?: any }> {
    try {
      const passwordResetToken =
        await this.passwordResetTokenRepository.findOne({
          where: {
            token,
            isUsed: false,
          },
          relations: ['user'],
        });

      if (!passwordResetToken) {
        return { valid: false };
      }

      if (new Date() > passwordResetToken.expiresAt) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          id: passwordResetToken.user.id,
          firstName: passwordResetToken.user.firstName,
          lastName: passwordResetToken.user.lastName,
          username: passwordResetToken.user.username,
        },
      };
    } catch (error) {
      logger.error('Error verifying password reset token', {
        error,
        token: token.substring(0, 8) + '...',
      });
      return { valid: false };
    }
  }

  async logout(userId: number, token: string) {
    await redis.del(`auth:${userId}:${token}`);
  }

  // Update staff methods
  async updateDoctor(
    doctorId: number,
    updateData: Partial<{
      licenseNumber: string;
      specialty: string;
      yearsOfExperience: number;
      hospitalId: number;
      hospitalName: string;
      gender: string;
      dateOfBirth: string;
      contactNo: string;
      firstName: string;
      lastName: string;
    }>,
  ) {
    console.log(
      `🔍 [Auth Service] Updating doctor ID: ${doctorId}`,
      updateData,
    );

    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['user'],
    });

    if (!doctor) {
      console.log(`❌ [Auth Service] Doctor with ID ${doctorId} not found`);
      throw createError(`Doctor with ID ${doctorId} not found`, 404);
    }

    // Update doctor fields
    if (updateData.licenseNumber !== undefined)
      doctor.licenseNumber = updateData.licenseNumber;
    if (updateData.specialty !== undefined)
      doctor.specialty = updateData.specialty;
    if (updateData.yearsOfExperience !== undefined)
      doctor.yearsOfExperience = updateData.yearsOfExperience;
    if (updateData.hospitalId !== undefined)
      doctor.hospitalId = updateData.hospitalId;
    if (updateData.hospitalName !== undefined)
      doctor.hospitalName = updateData.hospitalName;
    if (updateData.gender !== undefined) doctor.gender = updateData.gender;
    if (updateData.dateOfBirth !== undefined)
      doctor.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.contactNo !== undefined)
      doctor.contactNo = updateData.contactNo;

    // Update user fields
    if (updateData.firstName !== undefined)
      doctor.user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      doctor.user.lastName = updateData.lastName;

    await this.userRepository.save(doctor.user);
    const updatedDoctor = await this.doctorRepository.save(doctor);

    console.log(
      `✅ [Auth Service] Doctor updated successfully: ${doctor.user.firstName} ${doctor.user.lastName}`,
    );

    return updatedDoctor;
  }

  async updateMedicalStaff(
    medicalStaffId: number,
    updateData: Partial<{
      position: string;
      qualification: string;
      department: string;
      yearsOfExperience: number;
      hospitalId: number;
      hospitalName: string;
      gender: string;
      dateOfBirth: string;
      contactNo: string;
      firstName: string;
      lastName: string;
    }>,
  ) {
    console.log(
      `🔍 [Auth Service] Updating medical staff ID: ${medicalStaffId}`,
      updateData,
    );

    const medicalStaff = await this.medicalStaffRepository.findOne({
      where: { id: medicalStaffId },
      relations: ['user'],
    });

    if (!medicalStaff) {
      console.log(
        `❌ [Auth Service] Medical staff with ID ${medicalStaffId} not found`,
      );
      throw createError(
        `Medical staff with ID ${medicalStaffId} not found`,
        404,
      );
    }

    // Update medical staff fields
    if (updateData.position !== undefined)
      medicalStaff.position = updateData.position;
    if (updateData.qualification !== undefined)
      medicalStaff.qualification = updateData.qualification;
    if (updateData.department !== undefined)
      medicalStaff.department = updateData.department;
    if (updateData.yearsOfExperience !== undefined)
      medicalStaff.yearsOfExperience = updateData.yearsOfExperience;
    if (updateData.hospitalId !== undefined)
      medicalStaff.hospitalId = updateData.hospitalId;
    if (updateData.hospitalName !== undefined)
      medicalStaff.hospitalName = updateData.hospitalName;
    if (updateData.gender !== undefined)
      medicalStaff.gender = updateData.gender;
    if (updateData.dateOfBirth !== undefined)
      medicalStaff.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.contactNo !== undefined)
      medicalStaff.contactNo = updateData.contactNo;

    // Update user fields
    if (updateData.firstName !== undefined)
      medicalStaff.user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      medicalStaff.user.lastName = updateData.lastName;

    await this.userRepository.save(medicalStaff.user);
    const updatedMedicalStaff =
      await this.medicalStaffRepository.save(medicalStaff);

    console.log(
      `✅ [Auth Service] Medical staff updated successfully: ${medicalStaff.user.firstName} ${medicalStaff.user.lastName}`,
    );

    return updatedMedicalStaff;
  }

  async updateLabAssistant(
    labAssistantId: number,
    updateData: Partial<{
      qualification: string;
      department: string;
      yearsOfExperience: number;
      labId: number;
      labName: string;
      hospitalId: number;
      hospitalName: string;
      gender: string;
      dateOfBirth: string;
      contactNo: string;
      firstName: string;
      lastName: string;
    }>,
  ) {
    console.log(
      `🔍 [Auth Service] Updating lab assistant ID: ${labAssistantId}`,
      updateData,
    );

    const labAssistant = await this.labAssistantRepository.findOne({
      where: { id: labAssistantId },
      relations: ['user'],
    });

    if (!labAssistant) {
      console.log(
        `❌ [Auth Service] Lab assistant with ID ${labAssistantId} not found`,
      );
      throw createError(
        `Lab assistant with ID ${labAssistantId} not found`,
        404,
      );
    }

    // Update lab assistant fields
    if (updateData.qualification !== undefined)
      labAssistant.qualification = updateData.qualification;
    if (updateData.department !== undefined)
      labAssistant.department = updateData.department;
    if (updateData.yearsOfExperience !== undefined)
      labAssistant.yearsOfExperience = updateData.yearsOfExperience;
    if (updateData.labId !== undefined) labAssistant.labId = updateData.labId;
    if (updateData.labName !== undefined)
      labAssistant.labName = updateData.labName;
    if (updateData.hospitalId !== undefined)
      labAssistant.hospitalId = updateData.hospitalId;
    if (updateData.hospitalName !== undefined)
      labAssistant.hospitalName = updateData.hospitalName;
    if (updateData.gender !== undefined)
      labAssistant.gender = updateData.gender;
    if (updateData.dateOfBirth !== undefined)
      labAssistant.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.contactNo !== undefined)
      labAssistant.contactNo = updateData.contactNo;

    // Update user fields
    if (updateData.firstName !== undefined)
      labAssistant.user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      labAssistant.user.lastName = updateData.lastName;

    await this.userRepository.save(labAssistant.user);
    const updatedLabAssistant =
      await this.labAssistantRepository.save(labAssistant);

    console.log(
      `✅ [Auth Service] Lab assistant updated successfully: ${labAssistant.user.firstName} ${labAssistant.user.lastName}`,
    );

    return updatedLabAssistant;
  }
}

export default AuthService;
