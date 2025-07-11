import jwt from 'jsonwebtoken';
import ms from 'ms';
import bcrypt from 'bcrypt';
import axios from 'axios';
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
import { createError } from '../utils';
import { publishUserRegistered } from '../events/producers/userRegistered.producer';

interface RegisterLabAdminDto {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  institutionName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  accreditationNumber: string;
  licenseExpiryDate?: string;
  headTechnologistName?: string;
  availableTests?: string;
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
  password: string;

  licenseNumber: string;
  specialty: string;
  yearsOfExperience: number;

  hospitalId?: number;
  hospitalName?: string;
  gender?: string;
  dateOfBirth?: string;
}

interface RegisterLabAssistantDto {
  firstName: string;
  lastName: string;
  username: string;
  password: string;

  qualification: string;
  department: string;
  yearsOfExperience: number;

  labId?: number;
  labName?: string;
  hospitalId?: number;
  hospitalName?: string;
  gender?: string;
  dateOfBirth?: string;
}

interface RegisterMedicalStaffDto {
  firstName: string;
  lastName: string;
  username: string;
  password: string;

  position: string;
  qualification?: string;
  department?: string;
  yearsOfExperience: number;

  hospitalId?: number;
  hospitalName?: string;
  gender?: string;
  dateOfBirth?: string;
}

class AuthService {
  credentialRepository: Repository<Credential>;
  userRepository: Repository<User>;
  patientRepository: Repository<Patient>;
  doctorRepository: Repository<Doctor>;
  labAssistantRepository: Repository<LabAssistant>;
  medicalStaffRepository: Repository<MedicalStaff>;

  constructor() {
    this.credentialRepository = AppDataSource.getRepository(Credential);
    this.userRepository = AppDataSource.getRepository(User);
    this.patientRepository = AppDataSource.getRepository(Patient);
    this.doctorRepository = AppDataSource.getRepository(Doctor);
    this.labAssistantRepository = AppDataSource.getRepository(LabAssistant);
    this.medicalStaffRepository = AppDataSource.getRepository(MedicalStaff);
  }

  async labAdminRegister({
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
}: RegisterLabAdminDto) {
  // check existing user
  const existing = await this.credentialRepository.findOneBy({ username });
  if (existing) {
    throw createError('username already in use', 400);
  }

  // hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // create user in auth-service
  const user = new User();
  user.firstName = firstName;
  user.lastName = lastName;
  user.username = username;
  user.role = 'LAB_ADMIN';

  await this.userRepository.save(user);

  // create credentials
  const credential = new Credential();
  credential.username = username;
  credential.passwordHash = passwordHash;
  credential.user = user;

  await this.credentialRepository.save(credential);

  // 🚀 Now call the institution-service to register the lab
  await axios.post('http://localhost:3000/api/v1/institutions/lab/register', {
    institutionName,
    contactNumber,
    email,
    address,
    accreditationNumber,
    licenseExpiryDate,
    headTechnologistName,
    availableTests,
    adminUserId: user.id, // optional if your institution wants to link back
  });

  // publish user registered if needed
  await publishUserRegistered({
    key: user.id?.toString(),
    value: user,
  });

  return {
    message: 'Lab admin and lab institution registered successfully',
    userId: user.id,
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
      value: { ...user, patient },
    });

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
  }: RegisterDoctorDto) {
    const existing = await this.credentialRepository.findOneBy({ username });
    if (existing) {
      throw createError('email already in use', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

    await this.doctorRepository.save(doctor);

    await publishUserRegistered({
      key: user.id?.toString(),
      value: { ...user, doctor },
    });

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
  }: RegisterLabAssistantDto) {
    const existing = await this.credentialRepository.findOneBy({ username });

    if (existing) {
      throw createError('email already in use', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

    await this.labAssistantRepository.save(labAssistant);

    await publishUserRegistered({
      key: user.id?.toString(),
      value: { ...user, labAssistant },
    });

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
  }: RegisterMedicalStaffDto) {
    const existing = await this.credentialRepository.findOneBy({ username });

    if (existing) {
      throw createError('email already in use', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

    await this.medicalStaffRepository.save(medicalStaff);

    await publishUserRegistered({
      key: user.id?.toString(),
      value: { ...user, medicalStaff },
    });

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

    // ADMIN will keep hospitalId as null

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

  async logout(userId: number, token: string) {
    await redis.del(`auth:${userId}:${token}`);
  }
}

export default AuthService;
