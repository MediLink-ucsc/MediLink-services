import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Institution, InstitutionStatus, InstitutionType } from '../entity/institution.entity';
import { Lab } from '../entity/lab.entity';
import { Clinic } from '../entity/clinic.entity';
import { createError } from '../utils';
import { publishUserRegistered } from '../events/producers/institutionRegistered.producer';

interface RegisterLabDto {
  institutionName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  accreditationNumber: string;
  licenseExpiryDate?: string;
  headTechnologistName?: string;
  availableTests?: string;
}

interface RegisterClinicDto {
  institutionName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  registrationNumber: string;
  registrationExpiryDate?: string;
  headPhysicianName?: string;
  specializations?: string;
}

class InstitutionService {
  institutionRepository: Repository<Institution>;
  labRepository: Repository<Lab>;
  clinicRepository: Repository<Clinic>;

  constructor() {
    this.institutionRepository = AppDataSource.getRepository(Institution);
    this.labRepository = AppDataSource.getRepository(Lab);
    this.clinicRepository = AppDataSource.getRepository(Clinic);
  }

  async labRegister({
    institutionName,
    contactNumber,
    email,
    address,
    accreditationNumber,
    licenseExpiryDate,
    headTechnologistName,
    availableTests,
  }: RegisterLabDto) {
    const existing = await this.institutionRepository.findOneBy({
      institutionName,
      institutionType: InstitutionType.LAB,
    });

    if (existing) {
      throw createError('Lab with this name already exists', 400);
    }

    const institution = new Institution();
    institution.institutionName = institutionName;
    institution.institutionType = InstitutionType.LAB;
    institution.contactNumber = contactNumber ?? '';
    institution.email = email ?? '';
    institution.address = address ?? '';
    institution.status = InstitutionStatus.PENDING; 

    await this.institutionRepository.save(institution);

    const lab = new Lab();
    lab.institution = institution;
    lab.licenseNumber = accreditationNumber;
    if (licenseExpiryDate) {
      lab.licenseExpiryDate = new Date(licenseExpiryDate);
    }
    lab.headTechnologistName = headTechnologistName ?? '';
    lab.availableTests = availableTests ?? '';

    await this.labRepository.save(lab);

    await publishUserRegistered({
      key: institution.id?.toString(),
      value: { ...institution, lab },
    });

    return {
      institutionId: institution.id,
      labId: lab.id,
      message: 'Lab registered successfully',
    };
  }

  async clinicRegister({
    institutionName,
    contactNumber,
    email,
    address,
    registrationNumber,
    registrationExpiryDate,
    headPhysicianName,
    specializations,
  }: RegisterClinicDto) {
    const existing = await this.institutionRepository.findOneBy({
      institutionName,
      institutionType: InstitutionType.CLINIC,
    });

    if (existing) {
      throw createError('Clinic with this name already exists', 400);
    }

    const institution = new Institution();
    institution.institutionName = institutionName;
    institution.institutionType = InstitutionType.CLINIC;
    institution.contactNumber = contactNumber ?? '';
    institution.email = email ?? '';
    institution.address = address ?? '';
    institution.status = InstitutionStatus.PENDING;

    await this.institutionRepository.save(institution);

    const clinic = new Clinic();
    clinic.institution = institution;
    clinic.registrationNumber = registrationNumber;
    if (registrationExpiryDate) {
      clinic.registrationExpiryDate = new Date(registrationExpiryDate);
    }
    clinic.headPhysicianName = headPhysicianName ?? '';
    clinic.specializations = specializations ?? '';

    await this.clinicRepository.save(clinic);

    await publishUserRegistered({
      key: institution.id?.toString(),
      value: { ...institution, clinic },
    });

    return {
      institutionId: institution.id,
      clinicId: clinic.id,
      message: 'Clinic registered successfully',
    };
  }
}

export default InstitutionService;
