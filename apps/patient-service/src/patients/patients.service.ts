import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PatientEntity,
  PatientNextOfKinEntity,
  PatientMedicalHistoryEntity,
  PatientAllergyEntity,
  PatientMedicalAidEntity,
} from './entities';
import {
  CreatePatientDto,
  UpdatePatientDto,
  PatientFilterDto,
  CreateNextOfKinDto,
  UpdateNextOfKinDto,
  CreateMedicalHistoryDto,
  UpdateMedicalHistoryDto,
  CreateAllergyDto,
  UpdateAllergyDto,
  CreateMedicalAidDto,
  UpdateMedicalAidDto,
} from './dto';
import { validateChiNumber, normalizeChiNumber } from '../common/utils/chi-validator.util';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(PatientEntity)
    private readonly patientRepository: Repository<PatientEntity>,
    @InjectRepository(PatientNextOfKinEntity)
    private readonly nextOfKinRepository: Repository<PatientNextOfKinEntity>,
    @InjectRepository(PatientMedicalHistoryEntity)
    private readonly medicalHistoryRepository: Repository<PatientMedicalHistoryEntity>,
    @InjectRepository(PatientAllergyEntity)
    private readonly allergyRepository: Repository<PatientAllergyEntity>,
    @InjectRepository(PatientMedicalAidEntity)
    private readonly medicalAidRepository: Repository<PatientMedicalAidEntity>,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  // ==================== Patient CRUD ====================

  /** Generate a random valid CHI number (format: [1-9]\d{7}[A-NP-TV-Z]\d{2}) */
  private generateEmergencyChi(): string {
    const validLetters = 'ABCDEFGHIJKLMNPQRSTWXYZ';
    const d1 = (Math.floor(Math.random() * 9) + 1).toString();
    const d2to8 = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
    const letter = validLetters[Math.floor(Math.random() * validLetters.length)];
    const lastTwo = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${d1}${d2to8}${letter}${lastTwo}`;
  }

  private async generateUniqueChi(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const chi = this.generateEmergencyChi();
      const existing = await this.patientRepository.findOne({ where: { chiNumber: chi } });
      if (!existing) return chi;
    }
    throw new BadRequestException('Failed to generate a unique emergency CHI number — please try again');
  }

  async create(createPatientDto: CreatePatientDto, createdById?: string): Promise<PatientEntity> {
    let chiToUse = createPatientDto.chiNumber;

    if (!chiToUse) {
      if (!createPatientDto.isEmergency) {
        throw new BadRequestException('CHI number is required for non-emergency patients');
      }
      chiToUse = await this.generateUniqueChi();
    } else {
      const chiValidation = validateChiNumber(chiToUse);
      if (!chiValidation.isValid) {
        throw new BadRequestException({
          message: 'Invalid CHI number format',
          errors: chiValidation.errors,
        });
      }
    }

    const normalizedChi = normalizeChiNumber(chiToUse);

    const existingPatient = await this.patientRepository.findOne({
      where: { chiNumber: normalizedChi },
    });

    if (existingPatient) {
      throw new ConflictException('Patient with this CHI number already exists');
    }

    const patient = this.patientRepository.create({
      ...createPatientDto,
      chiNumber: normalizedChi,
      createdBy: createdById,
    });

    const saved = await this.patientRepository.save(patient);

    // Audit trail
    this.eventPublisher.publishAuditLog({
      userId: createdById,
      action: 'patient.created',
      resource: 'patient',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findAll(filterDto: PatientFilterDto): Promise<{
    data: PatientEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, chiNumber, gender, city, dateOfBirthFrom, dateOfBirthTo, isActive } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;
    const sortBy = filterDto.sortBy ?? 'createdAt';
    const sortOrder = filterDto.sortOrder ?? 'DESC';

    const queryBuilder = this.patientRepository.createQueryBuilder('patient');

    if (search) {
      queryBuilder.andWhere(
        '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR patient.chiNumber ILIKE :search OR patient.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (chiNumber) {
      queryBuilder.andWhere('patient.chiNumber = :chiNumber', {
        chiNumber: normalizeChiNumber(chiNumber),
      });
    }

    if (gender) {
      queryBuilder.andWhere('patient.gender = :gender', { gender });
    }

    if (city) {
      queryBuilder.andWhere('patient.city ILIKE :city', { city: `%${city}%` });
    }

    if (dateOfBirthFrom) {
      queryBuilder.andWhere('patient.dateOfBirth >= :dateOfBirthFrom', { dateOfBirthFrom });
    }

    if (dateOfBirthTo) {
      queryBuilder.andWhere('patient.dateOfBirth <= :dateOfBirthTo', { dateOfBirthTo });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('patient.isActive = :isActive', { isActive });
    }

    const validSortFields = ['createdAt', 'firstName', 'lastName', 'chiNumber', 'dateOfBirth'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder.orderBy(`patient.${sortField}`, sortOrder);

    const total = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<PatientEntity> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['nextOfKin', 'medicalHistory', 'allergies', 'medicalAid'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async findByChiNumber(chiNumber: string): Promise<PatientEntity> {
    const normalizedChi = normalizeChiNumber(chiNumber);
    const patient = await this.patientRepository.findOne({
      where: { chiNumber: normalizedChi },
      relations: ['nextOfKin', 'medicalHistory', 'allergies', 'medicalAid'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with CHI number ${normalizedChi} not found`);
    }

    return patient;
  }

  async validateChiFormat(chiNumber: string): Promise<{
    isValid: boolean;
    normalizedChi: string | null;
    errors: string[];
    exists?: boolean;
  }> {
    const validation = validateChiNumber(chiNumber);

    if (validation.isValid && validation.normalizedChi) {
      const existingPatient = await this.patientRepository.findOne({
        where: { chiNumber: validation.normalizedChi },
      });

      return {
        ...validation,
        exists: !!existingPatient,
      };
    }

    return validation;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
    updatedById?: string,
  ): Promise<PatientEntity> {
    const patient = await this.findOne(id);

    // Track changes for event publishing
    const changes: Record<string, { old: any; new: any }> = {};
    for (const [key, newValue] of Object.entries(updatePatientDto)) {
      if (newValue !== undefined && (patient as any)[key] !== newValue) {
        changes[key] = { old: (patient as any)[key], new: newValue };
      }
    }

    Object.assign(patient, {
      ...updatePatientDto,
      updatedBy: updatedById,
    });

    const saved = await this.patientRepository.save(patient);

    // Publish patient.updated event so clinical-service cascades changes
    if (Object.keys(changes).length > 0) {
      this.eventPublisher.publishPatientUpdated({
        patientId: saved.id,
        chiNumber: saved.chiNumber,
        firstName: saved.firstName,
        lastName: saved.lastName,
        changes,
      });
    }

    // Audit trail
    this.eventPublisher.publishAuditLog({
      userId: updatedById,
      action: 'patient.updated',
      resource: 'patient',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async deactivate(id: string, deactivatedById: string): Promise<PatientEntity> {
    const patient = await this.findOne(id);

    if (!patient.isActive) {
      throw new ConflictException('Patient is already deactivated');
    }

    patient.isActive = false;
    patient.deactivatedAt = new Date();
    patient.deactivatedBy = deactivatedById;
    patient.updatedBy = deactivatedById;

    const saved = await this.patientRepository.save(patient);

    // Publish patient.deactivated event so clinical-service cancels appointments
    this.eventPublisher.publishPatientDeactivated({
      patientId: saved.id,
      chiNumber: saved.chiNumber,
      deactivatedBy: deactivatedById,
    });

    // Audit trail
    this.eventPublisher.publishAuditLog({
      userId: deactivatedById,
      action: 'patient.deactivated',
      resource: 'patient',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async reactivate(id: string, reactivatedById: string): Promise<PatientEntity> {
    const patient = await this.findOne(id);

    if (patient.isActive) {
      throw new ConflictException('Patient is already active');
    }

    patient.isActive = true;
    patient.deactivatedAt = null;
    patient.deactivatedBy = null;
    patient.updatedBy = reactivatedById;

    const saved = await this.patientRepository.save(patient);

    // Publish reactivation event
    this.eventPublisher.publishPatientReactivated({
      patientId: saved.id,
      chiNumber: saved.chiNumber,
    });

    // Audit trail
    this.eventPublisher.publishAuditLog({
      userId: reactivatedById,
      action: 'patient.reactivated',
      resource: 'patient',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  // ==================== Next of Kin ====================

  async addNextOfKin(
    patientId: string,
    createDto: CreateNextOfKinDto,
    createdById?: string,
  ): Promise<PatientNextOfKinEntity> {
    await this.findOne(patientId);

    const nextOfKin = this.nextOfKinRepository.create({
      ...createDto,
      patientId,
      createdBy: createdById,
    });

    return this.nextOfKinRepository.save(nextOfKin);
  }

  async findAllNextOfKin(patientId: string): Promise<PatientNextOfKinEntity[]> {
    await this.findOne(patientId);

    return this.nextOfKinRepository.find({
      where: { patientId, isActive: true },
      order: { isPrimaryContact: 'DESC', createdAt: 'ASC' },
    });
  }

  async updateNextOfKin(
    patientId: string,
    nokId: string,
    updateDto: UpdateNextOfKinDto,
    updatedById?: string,
  ): Promise<PatientNextOfKinEntity> {
    await this.findOne(patientId);

    const nextOfKin = await this.nextOfKinRepository.findOne({
      where: { id: nokId, patientId },
    });

    if (!nextOfKin) {
      throw new NotFoundException(`Next of kin with ID ${nokId} not found`);
    }

    Object.assign(nextOfKin, {
      ...updateDto,
      updatedBy: updatedById,
    });

    return this.nextOfKinRepository.save(nextOfKin);
  }

  async removeNextOfKin(patientId: string, nokId: string, deletedById?: string): Promise<void> {
    await this.findOne(patientId);

    const nextOfKin = await this.nextOfKinRepository.findOne({
      where: { id: nokId, patientId },
    });

    if (!nextOfKin) {
      throw new NotFoundException(`Next of kin with ID ${nokId} not found`);
    }

    nextOfKin.isActive = false;
    nextOfKin.updatedBy = deletedById ?? null;

    await this.nextOfKinRepository.save(nextOfKin);
  }

  // ==================== Medical History ====================

  async addMedicalHistory(
    patientId: string,
    createDto: CreateMedicalHistoryDto,
    createdById?: string,
  ): Promise<PatientMedicalHistoryEntity> {
    await this.findOne(patientId);

    const medicalHistory = this.medicalHistoryRepository.create({
      ...createDto,
      patientId,
      createdBy: createdById,
    });

    return this.medicalHistoryRepository.save(medicalHistory);
  }

  async findAllMedicalHistory(patientId: string): Promise<PatientMedicalHistoryEntity[]> {
    await this.findOne(patientId);

    return this.medicalHistoryRepository.find({
      where: { patientId, isActive: true },
      order: { onsetDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateMedicalHistory(
    patientId: string,
    historyId: string,
    updateDto: UpdateMedicalHistoryDto,
    updatedById?: string,
  ): Promise<PatientMedicalHistoryEntity> {
    await this.findOne(patientId);

    const medicalHistory = await this.medicalHistoryRepository.findOne({
      where: { id: historyId, patientId },
    });

    if (!medicalHistory) {
      throw new NotFoundException(`Medical history with ID ${historyId} not found`);
    }

    Object.assign(medicalHistory, {
      ...updateDto,
      updatedBy: updatedById,
    });

    return this.medicalHistoryRepository.save(medicalHistory);
  }

  async removeMedicalHistory(
    patientId: string,
    historyId: string,
    deletedById?: string,
  ): Promise<void> {
    await this.findOne(patientId);

    const medicalHistory = await this.medicalHistoryRepository.findOne({
      where: { id: historyId, patientId },
    });

    if (!medicalHistory) {
      throw new NotFoundException(`Medical history with ID ${historyId} not found`);
    }

    medicalHistory.isActive = false;
    medicalHistory.updatedBy = deletedById ?? null;

    await this.medicalHistoryRepository.save(medicalHistory);
  }

  // ==================== Allergies ====================

  async addAllergy(
    patientId: string,
    createDto: CreateAllergyDto,
    createdById?: string,
  ): Promise<PatientAllergyEntity> {
    await this.findOne(patientId);

    const allergy = this.allergyRepository.create({
      ...createDto,
      patientId,
      createdBy: createdById,
    });

    return this.allergyRepository.save(allergy);
  }

  async findAllAllergies(patientId: string): Promise<PatientAllergyEntity[]> {
    await this.findOne(patientId);

    return this.allergyRepository.find({
      where: { patientId, isActive: true },
      order: { severity: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateAllergy(
    patientId: string,
    allergyId: string,
    updateDto: UpdateAllergyDto,
    updatedById?: string,
  ): Promise<PatientAllergyEntity> {
    await this.findOne(patientId);

    const allergy = await this.allergyRepository.findOne({
      where: { id: allergyId, patientId },
    });

    if (!allergy) {
      throw new NotFoundException(`Allergy with ID ${allergyId} not found`);
    }

    Object.assign(allergy, {
      ...updateDto,
      updatedBy: updatedById,
    });

    return this.allergyRepository.save(allergy);
  }

  async removeAllergy(patientId: string, allergyId: string, deletedById?: string): Promise<void> {
    await this.findOne(patientId);

    const allergy = await this.allergyRepository.findOne({
      where: { id: allergyId, patientId },
    });

    if (!allergy) {
      throw new NotFoundException(`Allergy with ID ${allergyId} not found`);
    }

    allergy.isActive = false;
    allergy.updatedBy = deletedById ?? null;

    await this.allergyRepository.save(allergy);
  }

  // ==================== Medical Aid ====================

  async addMedicalAid(
    patientId: string,
    createDto: CreateMedicalAidDto,
    createdById?: string,
  ): Promise<PatientMedicalAidEntity> {
    await this.findOne(patientId);

    const medicalAid = this.medicalAidRepository.create({
      ...createDto,
      patientId,
      createdBy: createdById,
    });

    return this.medicalAidRepository.save(medicalAid);
  }

  async findAllMedicalAid(patientId: string): Promise<PatientMedicalAidEntity[]> {
    await this.findOne(patientId);

    return this.medicalAidRepository.find({
      where: { patientId, isActive: true },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateMedicalAid(
    patientId: string,
    medicalAidId: string,
    updateDto: UpdateMedicalAidDto,
    updatedById?: string,
  ): Promise<PatientMedicalAidEntity> {
    await this.findOne(patientId);

    const medicalAid = await this.medicalAidRepository.findOne({
      where: { id: medicalAidId, patientId },
    });

    if (!medicalAid) {
      throw new NotFoundException(`Medical aid with ID ${medicalAidId} not found`);
    }

    Object.assign(medicalAid, {
      ...updateDto,
      updatedBy: updatedById,
    });

    return this.medicalAidRepository.save(medicalAid);
  }

  async removeMedicalAid(
    patientId: string,
    medicalAidId: string,
    deletedById?: string,
  ): Promise<void> {
    await this.findOne(patientId);

    const medicalAid = await this.medicalAidRepository.findOne({
      where: { id: medicalAidId, patientId },
    });

    if (!medicalAid) {
      throw new NotFoundException(`Medical aid with ID ${medicalAidId} not found`);
    }

    medicalAid.isActive = false;
    medicalAid.updatedBy = deletedById ?? null;

    await this.medicalAidRepository.save(medicalAid);
  }
}
