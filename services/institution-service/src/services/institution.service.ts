import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Lab } from '../entity/lab.entity';
import { Clinic } from '../entity/clinic.entity';
import { createError } from '../utils';
import { publishUserRegistered } from '../events/producers/institutionRegistered.producer';
import { publishInstitutionUpdated } from '../events/producers/institutionUpdated.producer';
import { publishInstitutionVerified } from '../events/producers/institutionVerified.producer';
import logger from '../config/logger';
import axios from 'axios';
import { config } from '../config';

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
      logger.error(
        'Failed to publish lab registration event to Kafka:',
        kafkaError,
      );
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
      logger.error(
        'Failed to publish clinic registration event to Kafka:',
        kafkaError,
      );
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
    const verifiedLab = await this.labRepository.save(lab);

    // Publish verification event to Kafka
    try {
      await publishInstitutionVerified({
        key: verifiedLab.id?.toString() || '',
        value: {
          institutionId: verifiedLab.id,
          type: 'lab',
          institutionName: verifiedLab.institutionName,
          status: verifiedLab.status,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (kafkaError) {
      logger.error(
        'Failed to publish lab verification event to Kafka:',
        kafkaError,
      );
      // Continue - don't fail the verification because of Kafka issues
    }

    return verifiedLab;
  }

  async verifyClinic(id: number): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({ where: { id } });

    if (!clinic) {
      throw createError(`Clinic with ID ${id} not found`, 404);
    }

    clinic.status = 'verified';
    const verifiedClinic = await this.clinicRepository.save(clinic);

    // Publish verification event to Kafka
    try {
      await publishInstitutionVerified({
        key: verifiedClinic.id?.toString() || '',
        value: {
          institutionId: verifiedClinic.id,
          type: 'clinic',
          institutionName: verifiedClinic.institutionName,
          status: verifiedClinic.status,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (kafkaError) {
      logger.error(
        'Failed to publish clinic verification event to Kafka:',
        kafkaError,
      );
      // Continue - don't fail the verification because of Kafka issues
    }

    return verifiedClinic;
  }

  async getAllClinics(): Promise<Clinic[]> {
    return await this.clinicRepository.find({
      order: {
        createdAt: 'DESC', // newest first
      },
    });
  }

  async getAllLabs(): Promise<Lab[]> {
    return await this.labRepository.find({
      order: {
        createdAt: 'DESC', // newest first
      },
    });
  }

  async getInstitutionByAdminUserId(
    adminUserId: number,
  ): Promise<{ type: 'clinic' | 'lab'; id: number } | null> {
    console.log(
      `🔍 [Institution Service] Searching for institution with admin user ID: ${adminUserId}`,
    );

    // First check if admin is a clinic admin
    const clinic = await this.clinicRepository.findOne({
      where: { adminUserId },
    });

    if (clinic) {
      console.log(
        `✅ [Institution Service] Found clinic ID ${clinic.id} for admin user ${adminUserId}`,
      );
      return { type: 'clinic', id: clinic.id };
    }

    // If not clinic admin, check if admin is a lab admin
    const lab = await this.labRepository.findOne({
      where: { adminUserId },
    });

    if (lab) {
      console.log(
        `✅ [Institution Service] Found lab ID ${lab.id} for admin user ${adminUserId}`,
      );
      return { type: 'lab', id: lab.id };
    }

    console.log(
      `⚠️ [Institution Service] No institution found for admin user ${adminUserId}`,
    );
    return null;
  }

  async getInstitutionDetails(
    institutionId: number,
    type: 'clinic' | 'lab',
  ): Promise<Clinic | Lab | null> {
    console.log(
      `🔍 [Institution Service] Getting ${type} details for ID: ${institutionId}`,
    );

    if (type === 'clinic') {
      const clinic = await this.clinicRepository.findOne({
        where: { id: institutionId },
      });
      if (!clinic) {
        console.log(
          `⚠️ [Institution Service] Clinic with ID ${institutionId} not found`,
        );
        return null;
      }
      console.log(
        `✅ [Institution Service] Found clinic: ${clinic.institutionName}`,
      );
      return clinic;
    } else {
      const lab = await this.labRepository.findOne({
        where: { id: institutionId },
      });
      if (!lab) {
        console.log(
          `⚠️ [Institution Service] Lab with ID ${institutionId} not found`,
        );
        return null;
      }
      console.log(`✅ [Institution Service] Found lab: ${lab.institutionName}`);
      return lab;
    }
  }

  async updateInstitutionDetails(
    institutionId: number,
    type: 'clinic' | 'lab',
    updateData: Partial<RegisterClinicDto | RegisterLabDto>,
  ): Promise<Clinic | Lab | null> {
    console.log(
      `🔍 [Institution Service] Updating ${type} details for ID: ${institutionId}`,
    );
    console.log(`📝 [Institution Service] Update data:`, updateData);

    if (type === 'clinic') {
      const clinic = await this.clinicRepository.findOne({
        where: { id: institutionId },
      });

      if (!clinic) {
        console.log(
          `⚠️ [Institution Service] Clinic with ID ${institutionId} not found`,
        );
        return null;
      }

      // Update only provided fields
      if (updateData.institutionName)
        clinic.institutionName = updateData.institutionName;
      if (updateData.address) clinic.address = updateData.address;
      if (updateData.city) clinic.city = updateData.city;
      if (updateData.provinceState)
        clinic.provinceState = updateData.provinceState;
      if (updateData.postalCode) clinic.postalCode = updateData.postalCode;
      if (updateData.phoneNumber) clinic.phoneNumber = updateData.phoneNumber;
      if (updateData.emailAddress)
        clinic.emailAddress = updateData.emailAddress;
      if (updateData.website !== undefined) clinic.website = updateData.website;
      if (updateData.licenseNumber)
        clinic.licenseNumber = updateData.licenseNumber;
      if (updateData.institutionLogo !== undefined)
        clinic.institutionLogo = updateData.institutionLogo;

      const updatedClinic = await this.clinicRepository.save(clinic);
      console.log(
        `✅ [Institution Service] Clinic updated: ${updatedClinic.institutionName}`,
      );

      // Publish update event to Kafka
      try {
        const updatedFields = Object.keys(updateData);
        await publishInstitutionUpdated({
          key: updatedClinic.id?.toString() || '',
          value: {
            institutionId: updatedClinic.id,
            type: 'clinic',
            institutionName: updatedClinic.institutionName,
            updatedFields,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (kafkaError) {
        logger.error(
          'Failed to publish clinic update event to Kafka:',
          kafkaError,
        );
        // Continue - don't fail the update because of Kafka issues
      }

      return updatedClinic;
    } else {
      const lab = await this.labRepository.findOne({
        where: { id: institutionId },
      });

      if (!lab) {
        console.log(
          `⚠️ [Institution Service] Lab with ID ${institutionId} not found`,
        );
        return null;
      }

      // Update only provided fields
      if (updateData.institutionName)
        lab.institutionName = updateData.institutionName;
      if (updateData.address) lab.address = updateData.address;
      if (updateData.city) lab.city = updateData.city;
      if (updateData.provinceState)
        lab.provinceState = updateData.provinceState;
      if (updateData.postalCode) lab.postalCode = updateData.postalCode;
      if (updateData.phoneNumber) lab.phoneNumber = updateData.phoneNumber;
      if (updateData.emailAddress) lab.emailAddress = updateData.emailAddress;
      if (updateData.website !== undefined) lab.website = updateData.website;
      if (updateData.licenseNumber)
        lab.licenseNumber = updateData.licenseNumber;
      if (updateData.institutionLogo !== undefined)
        lab.institutionLogo = updateData.institutionLogo;

      const updatedLab = await this.labRepository.save(lab);
      console.log(
        `✅ [Institution Service] Lab updated: ${updatedLab.institutionName}`,
      );

      // Publish update event to Kafka
      try {
        const updatedFields = Object.keys(updateData);
        await publishInstitutionUpdated({
          key: updatedLab.id?.toString() || '',
          value: {
            institutionId: updatedLab.id,
            type: 'lab',
            institutionName: updatedLab.institutionName,
            updatedFields,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (kafkaError) {
        logger.error(
          'Failed to publish lab update event to Kafka:',
          kafkaError,
        );
        // Continue - don't fail the update because of Kafka issues
      }

      return updatedLab;
    }
  }

  async getClinicStaff(clinicId: number, authHeader?: string): Promise<any> {
    console.log(
      `🔍 [Institution Service] getClinicStaff called for clinic ID: ${clinicId}`,
    );
    console.log(
      `🔑 [Institution Service] Auth header ${authHeader ? 'present' : 'missing'}`,
    );

    // First verify that the clinic exists
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId },
    });

    if (!clinic) {
      console.error(
        `❌ [Institution Service] Clinic with ID ${clinicId} not found`,
      );
      throw createError(`Clinic with ID ${clinicId} not found`, 404);
    }

    console.log(
      `✅ [Institution Service] Clinic found: ${clinic.institutionName}`,
    );

    try {
      // Prepare headers for forwarding authentication
      const headers: any = {};
      if (authHeader) {
        headers.authorization = authHeader;
        console.log(
          '🔑 [Institution Service] Forwarding authorization header to auth service',
        );
      }

      // Fetch doctors for this clinic (using hospitalId in doctor entity)
      const doctorsUrl = `${config.AUTH_SERVICE_URL}/api/v1/auth/medvaultpro/hospital/${clinicId}/doctors`;
      console.log(
        `📞 [Institution Service] Calling auth service for doctors: ${doctorsUrl}`,
      );

      const doctorsResponse = await axios.get(doctorsUrl, { headers });
      console.log(
        `✅ [Institution Service] Doctors fetched successfully:`,
        doctorsResponse.data,
      );

      // Fetch medical staff for this clinic
      const medicalStaffUrl = `${config.AUTH_SERVICE_URL}/api/v1/auth/medvaultpro/hospital/${clinicId}/medical-staff`;
      console.log(
        `📞 [Institution Service] Calling auth service for medical staff: ${medicalStaffUrl}`,
      );

      const medicalStaffResponse = await axios.get(medicalStaffUrl, {
        headers,
      });
      console.log(
        `✅ [Institution Service] Medical staff fetched successfully:`,
        medicalStaffResponse.data,
      );

      const result = {
        clinic: {
          id: clinic.id,
          institutionName: clinic.institutionName,
          address: clinic.address,
          city: clinic.city,
        },
        doctors: doctorsResponse.data.data || [],
        medicalStaff: medicalStaffResponse.data.data || [],
      };

      console.log(`✅ [Institution Service] Returning clinic staff data`);
      return result;
    } catch (error: any) {
      console.error(
        '❌ [Institution Service] Failed to fetch clinic staff from auth service:',
      );
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
      });
      logger.error('Failed to fetch clinic staff from auth service:', error);
      throw createError('Failed to fetch clinic staff', 500);
    }
  }

  async getLabStaff(labId: number, authHeader?: string): Promise<any> {
    console.log(
      `🔍 [Institution Service] getLabStaff called for lab ID: ${labId}`,
    );
    console.log(
      `🔑 [Institution Service] Auth header ${authHeader ? 'present' : 'missing'}`,
    );

    // First verify that the lab exists
    const lab = await this.labRepository.findOne({ where: { id: labId } });

    if (!lab) {
      console.error(`❌ [Institution Service] Lab with ID ${labId} not found`);
      throw createError(`Lab with ID ${labId} not found`, 404);
    }

    console.log(`✅ [Institution Service] Lab found: ${lab.institutionName}`);

    try {
      // Prepare headers for forwarding authentication
      const headers: any = {};
      if (authHeader) {
        headers.authorization = authHeader;
        console.log(
          '🔑 [Institution Service] Forwarding authorization header to auth service',
        );
      }

      // Fetch lab assistants for this lab
      const assistantsUrl = `${config.AUTH_SERVICE_URL}/api/v1/auth/medvaultpro/lab/${labId}/assistants`;
      console.log(
        `📞 [Institution Service] Calling auth service for lab assistants: ${assistantsUrl}`,
      );

      const assistantsResponse = await axios.get(assistantsUrl, { headers });
      console.log(
        `✅ [Institution Service] Lab assistants fetched successfully:`,
        assistantsResponse.data,
      );

      const result = {
        lab: {
          id: lab.id,
          institutionName: lab.institutionName,
          address: lab.address,
          city: lab.city,
        },
        labAssistants: assistantsResponse.data.data || [],
      };

      console.log(`✅ [Institution Service] Returning lab staff data`);
      return result;
    } catch (error: any) {
      console.error(
        '❌ [Institution Service] Failed to fetch lab staff from auth service:',
      );
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
      });
      logger.error('Failed to fetch lab staff from auth service:', error);
      throw createError('Failed to fetch lab staff', 500);
    }
  }
}

export default InstitutionService;
