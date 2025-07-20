import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Lab } from '../entity/lab.entity';
import { Clinic } from '../entity/clinic.entity';
import { createError } from '../utils';
import { publishUserRegistered } from '../events/producers/institutionRegistered.producer';

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

  await publishUserRegistered({
    key: lab.id?.toString(),
    value: lab,
  });

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

  await publishUserRegistered({
    key: clinic.id?.toString(),
    value: clinic,
  });

  return {
    clinicId: clinic.id,
    message: 'Clinic registered successfully',
  };
}

}

export default InstitutionService;
