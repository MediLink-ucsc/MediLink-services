import jwt from 'jsonwebtoken';
import ms from 'ms';
import bcrypt from 'bcrypt';

import { AppDataSource } from '../data-source';
import { config } from '../config';
import redis from '../config/redis';
import { Repository } from 'typeorm';
import { Credential } from '../entity/credential.entity';
import { User } from '../entity/user.entity';
import { Patient } from '../entity/patient.entity';
import { Doctor } from '../entity/doctor.entity';
import { createError } from '../utils';
import { publishUserRegistered } from '../events/producers/userRegistered.producer';

interface RegisterPatientDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  contactNumber: string;
}

interface RegisterDoctorDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  licenseNumber: string;
  specialty: string;
  yearsOfExperience: number;
  contactNumber: string;

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

  constructor() {
    this.credentialRepository = AppDataSource.getRepository(Credential);
    this.userRepository = AppDataSource.getRepository(User);
    this.patientRepository = AppDataSource.getRepository(Patient);
    this.doctorRepository = AppDataSource.getRepository(Doctor);
  }

  async patientRegister({ firstName, lastName, email, password, age, gender, contactNumber }: RegisterPatientDto) {
    const existing = await this.credentialRepository.findOneBy({ email });

    if (existing) {
      throw createError('email already in use', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.role = 'PATIENT';

    await this.userRepository.save(user);

    const credential = new Credential();
    credential.email = email;
    credential.passwordHash = passwordHash;
    credential.user = user;

    await this.credentialRepository.save(credential);

    const patient = new Patient();
    patient.user = user;
    patient.age = age;
    patient.gender = gender;
    patient.contactNumber = contactNumber;

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
}: RegisterDoctorDto) {
  const existing = await this.credentialRepository.findOneBy({ email });
  if (existing) {
    throw createError('email already in use', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = new User();
  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;
  user.role = 'DOCTOR';

  await this.userRepository.save(user);

  const credential = new Credential();
  credential.email = email;
  credential.passwordHash = passwordHash;
  credential.user = user;

  await this.credentialRepository.save(credential);

  const doctor = new Doctor();
  doctor.user = user;
  doctor.licenseNumber = licenseNumber;
  doctor.specialty = specialty;
  doctor.yearsOfExperience = yearsOfExperience;
  doctor.contactNumber = contactNumber;
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


  async patientLogin(email: string, password: string) {
    const credential = await this.credentialRepository.findOne({
      where: { email },
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
        email: credential.email,
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
      email: credential.email,
      role: credential.user.role,
    };
  }

  async doctorLogin(email: string, password: string) {
    const credential = await this.credentialRepository.findOne({
      where: { email },
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

    if (credential.user.role !== 'DOCTOR') {
    throw createError('not authorized as doctor', 403);
    }

    const token = jwt.sign(
      {
        id: credential.user.id,
        email: credential.email,
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
      email: credential.email,
      role: credential.user.role,
    };
  }

  async logout(userId: number, token: string) {
    await redis.del(`auth:${userId}:${token}`);
  }
}

export default AuthService;