import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DischargeFormEntity } from './entities/discharge-form.entity';
import { EncounterEntity } from '../encounters/entities/encounter.entity';
import {
  CreateDischargeFormDto,
  UpdateClinicalSectionDto,
  UpdatePharmacySectionDto,
  UpdateOperationsSectionDto,
  UpdateNursingSectionDto,
  UpdateFollowUpSectionDto,
  UpdateVitalsDto,
  CompleteDischargeDto,
} from './dto';
import { ClinicalEventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class DischargeService {
  constructor(
    @InjectRepository(DischargeFormEntity)
    private readonly dischargeFormRepository: Repository<DischargeFormEntity>,
    @InjectRepository(EncounterEntity)
    private readonly encounterRepository: Repository<EncounterEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
  ) {}

  // ==================== Discharge Form CRUD ====================

  async create(
    encounterId: string | null,
    dto: CreateDischargeFormDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    if (encounterId) {
      const existingForm = await this.dischargeFormRepository.findOne({
        where: { encounterId },
      });
      if (existingForm) {
        throw new ConflictException('A discharge form already exists for this encounter');
      }
    }

    // Load encounter to get patient details if encounterId provided
    const encounter = encounterId
      ? await this.encounterRepository.findOne({ where: { id: encounterId } })
      : null;

    const form = this.dischargeFormRepository.create({
      encounterId: encounterId || null,
      patientId: dto.patientId || encounter?.patientId,
      patientChi: dto.patientChi || encounter?.patientChi || null,
      patientName: (dto as any).patientName || null,
      primaryDiagnosis: dto.dischargeDiagnosis || dto.primaryDiagnosis || null,
      clinicalSummary: dto.clinicalSummary || null,
      lastUpdatedBy: userId,
      lastUpdatedSection: 'initial',
    });

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'discharge_form.created',
      resource: 'discharge_form',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findOne(id: string): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({
      where: { id },
      relations: ['encounter'],
    });

    if (!form) {
      throw new NotFoundException(`Discharge form with ID ${id} not found`);
    }

    return form;
  }

  async findByEncounter(encounterId: string): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({
      where: { encounterId },
      relations: ['encounter'],
    });

    if (!form) {
      throw new NotFoundException(`Discharge form for encounter ${encounterId} not found`);
    }

    return form;
  }

  async findByPatient(patientId: string): Promise<DischargeFormEntity[]> {
    return this.dischargeFormRepository.find({
      where: { patientId },
      relations: ['encounter'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(filters?: { status?: string }): Promise<DischargeFormEntity[]> {
    const where: Record<string, any> = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    return this.dischargeFormRepository.find({
      where,
      relations: ['encounter'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<DischargeFormEntity[]> {
    return this.dischargeFormRepository.find({
      where: { status: 'active' },
      relations: ['encounter'],
      order: { createdAt: 'DESC' },
    });
  }

  // ==================== Generic Section Update (dispatches to specific handlers) ====================

  async updateSection(
    id: string,
    section: string,
    content: Record<string, any>,
    version: number,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    switch (section) {
      case 'clinical':
        return this.updateClinicalSection(id, { ...content, version } as UpdateClinicalSectionDto, userId);
      case 'pharmacy':
        return this.updatePharmacySection(id, { ...content, version } as UpdatePharmacySectionDto, userId);
      case 'operations':
        return this.updateOperationsSection(id, { ...content, version } as UpdateOperationsSectionDto, userId);
      case 'nursing':
        return this.updateNursingSection(id, { ...content, version } as UpdateNursingSectionDto, userId);
      case 'followup':
        return this.updateFollowUpSection(id, { ...content, version } as UpdateFollowUpSectionDto, userId);
      default:
        throw new BadRequestException(`Unknown section: ${section}`);
    }
  }

  // ==================== Section Updates with Optimistic Locking ====================

  async updateClinicalSection(
    id: string,
    dto: UpdateClinicalSectionDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Discharge form with ID ${id} not found`);
    }

    if (form.status !== 'active') {
      throw new BadRequestException('Form is not active');
    }

    if (dto.version && dto.version !== form.version) {
      throw new ConflictException('This form has been modified by another user. Please refresh.');
    }

    if (dto.primaryDiagnosis !== undefined) form.primaryDiagnosis = dto.primaryDiagnosis;
    if (dto.secondaryDiagnoses !== undefined) form.secondaryDiagnoses = dto.secondaryDiagnoses;
    if (dto.clinicalSummary !== undefined) form.clinicalSummary = dto.clinicalSummary;
    if (dto.treatmentProvided !== undefined) form.treatmentProvided = dto.treatmentProvided;
    if (dto.dischargeType !== undefined) form.dischargeType = dto.dischargeType;

    form.clinicalCompletedBy = userId ?? null;
    form.clinicalCompletedAt = new Date();
    form.version += 1;
    form.lastUpdatedBy = userId ?? null;
    form.lastUpdatedSection = 'clinical';

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'discharge_form.clinical_section_updated',
      resource: 'discharge_form',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async updatePharmacySection(
    id: string,
    dto: UpdatePharmacySectionDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Discharge form with ID ${id} not found`);
    }

    if (form.status !== 'active') {
      throw new BadRequestException('Form is not active');
    }

    if (dto.version && dto.version !== form.version) {
      throw new ConflictException('This form has been modified by another user. Please refresh.');
    }

    if (dto.medicationsOnDischarge !== undefined) form.medicationsOnDischarge = dto.medicationsOnDischarge;
    if (dto.pharmacyNotes !== undefined) form.pharmacyNotes = dto.pharmacyNotes;

    form.pharmacyCompletedBy = userId ?? null;
    form.pharmacyCompletedAt = new Date();
    form.version += 1;
    form.lastUpdatedBy = userId ?? null;
    form.lastUpdatedSection = 'pharmacy';

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'discharge_form.pharmacy_section_updated',
      resource: 'discharge_form',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async updateOperationsSection(
    id: string,
    dto: UpdateOperationsSectionDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Discharge form with ID ${id} not found`);
    }

    if (form.status !== 'active') {
      throw new BadRequestException('Form is not active');
    }

    if (dto.version && dto.version !== form.version) {
      throw new ConflictException('This form has been modified by another user. Please refresh.');
    }

    if (dto.operationsAndProcedures !== undefined) form.operationsAndProcedures = dto.operationsAndProcedures;
    if (dto.surgeonNotes !== undefined) form.surgeonNotes = dto.surgeonNotes;

    form.operationsCompletedBy = userId ?? null;
    form.operationsCompletedAt = new Date();
    form.version += 1;
    form.lastUpdatedBy = userId ?? null;
    form.lastUpdatedSection = 'operations';

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'discharge_form.operations_section_updated',
      resource: 'discharge_form',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async updateNursingSection(
    id: string,
    dto: UpdateNursingSectionDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Discharge form with ID ${id} not found`);
    }

    if (form.status !== 'active') {
      throw new BadRequestException('Form is not active');
    }

    if (dto.version && dto.version !== form.version) {
      throw new ConflictException('This form has been modified by another user. Please refresh.');
    }

    if (dto.nursingNotes !== undefined) form.nursingNotes = dto.nursingNotes;
    if (dto.nursingAssessment !== undefined) form.nursingAssessment = dto.nursingAssessment;
    if (dto.vitalSignsOnDischarge !== undefined) form.vitalSignsOnDischarge = dto.vitalSignsOnDischarge;
    if (dto.dietaryInstructions !== undefined) form.dietaryInstructions = dto.dietaryInstructions;
    if (dto.activityRestrictions !== undefined) form.activityRestrictions = dto.activityRestrictions;

    form.nursingCompletedBy = userId ?? null;
    form.nursingCompletedAt = new Date();
    form.version += 1;
    form.lastUpdatedBy = userId ?? null;
    form.lastUpdatedSection = 'nursing';

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'discharge_form.nursing_section_updated',
      resource: 'discharge_form',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async updateFollowUpSection(
    id: string,
    dto: UpdateFollowUpSectionDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Discharge form with ID ${id} not found`);
    }

    if (form.status !== 'active') {
      throw new BadRequestException('Form is not active');
    }

    if (dto.version && dto.version !== form.version) {
      throw new ConflictException('This form has been modified by another user. Please refresh.');
    }

    if (dto.followUpInstructions !== undefined) form.followUpInstructions = dto.followUpInstructions;
    if (dto.followUpDate !== undefined) form.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;
    if (dto.followUpDoctor !== undefined) form.followUpDoctor = dto.followUpDoctor;
    if (dto.patientEducation !== undefined) form.patientEducation = dto.patientEducation;

    form.version += 1;
    form.lastUpdatedBy = userId ?? null;
    form.lastUpdatedSection = 'followup';

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'discharge_form.followup_section_updated',
      resource: 'discharge_form',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async updateVitals(
    id: string,
    dto: UpdateVitalsDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Discharge form with ID ${id} not found`);
    }

    if (form.status !== 'active') {
      throw new BadRequestException('Form is not active');
    }

    form.vitalSignsOnDischarge = {
      bp: dto.bloodPressure,
      hr: dto.heartRate !== undefined ? String(dto.heartRate) : undefined,
      temp: dto.temperature !== undefined ? String(dto.temperature) : undefined,
      spo2: dto.oxygenSaturation !== undefined ? String(dto.oxygenSaturation) : undefined,
      rr: dto.respiratoryRate !== undefined ? String(dto.respiratoryRate) : undefined,
      weight: dto.weight !== undefined ? String(dto.weight) : undefined,
      height: dto.height !== undefined ? String(dto.height) : undefined,
    };
    form.vitalsRecordedBy = userId ?? null;
    form.vitalsRecordedAt = new Date();
    form.lastUpdatedBy = userId ?? null;
    form.lastUpdatedSection = 'vitals';

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'discharge_form.vitals_updated',
      resource: 'discharge_form',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  // ==================== Complete Discharge ====================

  async complete(
    id: string,
    dto: CompleteDischargeDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    const form = await this.dischargeFormRepository.findOne({
      where: { id },
      relations: ['encounter'],
    });

    if (!form) {
      throw new NotFoundException(`Discharge form with ID ${id} not found`);
    }

    if (form.status !== 'active') {
      throw new BadRequestException('Form is not active');
    }

    form.status = 'completed';
    form.dischargedBy = userId ?? null;
    form.dischargedAt = new Date();
    form.lastUpdatedBy = userId ?? null;
    form.lastUpdatedSection = 'complete';
    form.version += 1;

    const savedForm = await this.dischargeFormRepository.save(form);

    // Mark encounter as discharged
    if (form.encounter) {
      form.encounter.status = 'discharged';
      form.encounter.dischargeDate = new Date();
      form.encounter.dischargeDiagnosis = form.primaryDiagnosis;
      await this.encounterRepository.save(form.encounter);
    }

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'discharge_form.completed',
      resource: 'discharge_form',
      resourceId: savedForm.id,
      status: 'success',
    });

    return savedForm;
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(role?: string): Promise<Record<string, unknown>> {
    const activeForms = await this.dischargeFormRepository.count({
      where: { status: 'active' },
    });

    const pendingClinicalReview = await this.dischargeFormRepository
      .createQueryBuilder('form')
      .where('form.status = :status', { status: 'active' })
      .andWhere('form.clinicalCompletedAt IS NULL')
      .getCount();

    const pendingPharmacyReview = await this.dischargeFormRepository
      .createQueryBuilder('form')
      .where('form.status = :status', { status: 'active' })
      .andWhere('form.pharmacyCompletedAt IS NULL')
      .getCount();

    const pendingNursingReview = await this.dischargeFormRepository
      .createQueryBuilder('form')
      .where('form.status = :status', { status: 'active' })
      .andWhere('form.nursingCompletedAt IS NULL')
      .getCount();

    return {
      activeForms,
      pendingClinicalReview,
      pendingPharmacyReview,
      pendingNursingReview,
    };
  }
}
