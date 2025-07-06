import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Institution, InstitutionStatus, InstitutionType } from '../entity/institution.entity';
import { Lab } from '../entity/lab.entity';
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

class InstitutionService {
  institutionRepository: Repository<Institution>;
  labRepository: Repository<Lab>;

  constructor() {
    this.institutionRepository = AppDataSource.getRepository(Institution);
    this.labRepository = AppDataSource.getRepository(Lab);
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
}

export default InstitutionService;
