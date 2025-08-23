import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Lab } from '../entity/lab.entity';
import { Clinic } from '../entity/clinic.entity';
import { createError } from '../utils';
import { publishUserRegistered } from '../events/producers/institutionRegistered.producer';
import logger from '../config/logger';

interface RegisterLabDto {
  institutionName: string;
  address?: string;
  city: string;
  provinceState: string;
  postalCode: string;
  phoneNumber: string;
  emailAddress: string;
  website?: string;
  licenseNumber: string;
  institutionLogo?: string;
  adminUserId: number;
}


interface RegisterClinicDto {
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
  adminUserId: number;
}


class InstitutionService {
  labRepository: Repository<Lab>;
  clinicRepository: Repository<Clinic>;

  constructor() {
    this.labRepository = AppDataSource.getRepository(Lab);
    this.clinicRepository = AppDataSource.getRepository(Clinic);
  }

  async labRegister({
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
}: RegisterLabDto) {
  // Check if a lab with the same institutionName exists
  const existing = await this.labRepository.findOneBy({
    institutionName,
  });

  if (existing) {
    throw createError('Lab with this name already exists', 400);
  }

  // Create new lab entity with all properties
  const lab = new Lab();
  lab.institutionName = institutionName;
  lab.address = address ?? '';
  lab.city = city;
  lab.provinceState = provinceState;
  lab.postalCode = postalCode;
  lab.phoneNumber = phoneNumber;
  lab.emailAddress = emailAddress;
  lab.website = website ?? '';
  lab.licenseNumber = licenseNumber;
  lab.institutionLogo = institutionLogo ?? '';
  lab.adminUserId = adminUserId;

  await this.labRepository.save(lab);

  // Try to publish event, but don't fail if Kafka is unavailable
  try {
    await publishUserRegistered({
      key: lab.id?.toString(),
      value: lab,
    });
  } catch (kafkaError) {
    logger.error('Failed to publish lab registration event to Kafka:', kafkaError);
    // Continue execution - don't fail the registration because of Kafka issues
  }

  return {
    labId: lab.id,
    message: 'Lab registered successfully',
  };
}


 async clinicRegister({
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
}: RegisterClinicDto) {
  // Check if a clinic with the same institutionName exists
  const existing = await this.clinicRepository.findOneBy({
    institutionName,
  });

  if (existing) {
    throw createError('Clinic with this name already exists', 400);
  }

  // Create new clinic entity with all properties
  const clinic = new Clinic();
  clinic.institutionName = institutionName;
  clinic.address = address ?? '';
  clinic.city = city;
  clinic.provinceState = provinceState;
  clinic.postalCode = postalCode;
  clinic.phoneNumber = phoneNumber;
  clinic.emailAddress = emailAddress;
  clinic.website = website ?? '';
  clinic.licenseNumber = licenseNumber;
  clinic.institutionLogo = institutionLogo ?? '';
  clinic.adminUserId = adminUserId;

  await this.clinicRepository.save(clinic);

  // Try to publish event, but don't fail if Kafka is unavailable
  try {
    await publishUserRegistered({
      key: clinic.id?.toString(),
      value: clinic,
    });
  } catch (kafkaError) {
    logger.error('Failed to publish clinic registration event to Kafka:', kafkaError);
    // Continue execution - don't fail the registration because of Kafka issues
  }

  return {
    clinicId: clinic.id,
    message: 'Clinic registered successfully',
  };
}

  async verifyLab(id: number): Promise<Lab> {
    const lab = await this.labRepository.findOne({ where: { id } });

    if (!lab) {
      throw createError(`Lab with ID ${id} not found`, 404);
    }

    lab.status = 'verified';
    return this.labRepository.save(lab);
  }

  async verifyClinic(id: number): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({ where: { id } });

    if (!clinic) {
      throw createError(`Clinic with ID ${id} not found`, 404);
    }

    clinic.status = 'verified';
    return this.clinicRepository.save(clinic);
  }

  async getAllClinics(): Promise<Clinic[]> {
    return await this.clinicRepository.find({
      order: {
        createdAt: "DESC", // newest first
      },
    });
  }

  async getAllLabs(): Promise<Lab[]> {
    return await this.labRepository.find({
      order: {
        createdAt: "DESC", // newest first
      },
    });
  }

}

export default InstitutionService;
