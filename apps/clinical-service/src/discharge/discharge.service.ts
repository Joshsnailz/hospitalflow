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
    encounterId: string,
    dto: CreateDischargeFormDto,
    userId?: string,
  ): Promise<DischargeFormEntity> {
    const existingForm = await this.dischargeFormRepository.findOne({
      where: { encounterId },
    });

    if (existingForm) {
      throw new ConflictException('A discharge form already exists for this encounter');
    }

    const form = this.dischargeFormRepository.create({
      encounterId,
      ...dto,
      lastUpdatedBy: userId,
    });

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
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

  async findActive(): Promise<DischargeFormEntity[]> {
    return this.dischargeFormRepository.find({
      where: { status: 'active' },
      relations: ['encounter'],
      order: { createdAt: 'DESC' },
    });
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

    if (dto.dischargeDiagnosis !== undefined) form.dischargeDiagnosis = dto.dischargeDiagnosis;
    if (dto.clinicalSummary !== undefined) form.clinicalSummary = dto.clinicalSummary;
    if (dto.treatmentPlan !== undefined) form.treatmentPlan = dto.treatmentPlan;
    if (dto.dischargeType !== undefined) form.dischargeType = dto.dischargeType;
    if (dto.followUpInstructions !== undefined) form.followUpInstructions = dto.followUpInstructions;
    if (dto.followUpDate !== undefined) form.followUpDate = new Date(dto.followUpDate);

    form.clinicalCompletedBy = userId ?? null;
    form.clinicalCompletedAt = new Date();
    form.version += 1;
    form.lastUpdatedBy = userId ?? null;

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'UPDATE',
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

    if (dto.dischargeMedications !== undefined) form.dischargeMedications = dto.dischargeMedications;
    if (dto.medicationReconciliationNotes !== undefined) {
      form.medicationReconciliationNotes = dto.medicationReconciliationNotes;
    }

    form.pharmacyCompletedBy = userId ?? null;
    form.pharmacyCompletedAt = new Date();
    form.version += 1;
    form.lastUpdatedBy = userId ?? null;

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'UPDATE',
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

    if (dto.proceduresPerformed !== undefined) form.proceduresPerformed = dto.proceduresPerformed;
    if (dto.operationsNotes !== undefined) form.operationsNotes = dto.operationsNotes;

    form.operationsCompletedBy = userId ?? null;
    form.operationsCompletedAt = new Date();
    form.version += 1;
    form.lastUpdatedBy = userId ?? null;

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'UPDATE',
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

    form.nursingCompletedBy = userId ?? null;
    form.nursingCompletedAt = new Date();
    form.version += 1;
    form.lastUpdatedBy = userId ?? null;

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'UPDATE',
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

    form.vitals = {
      temperature: dto.temperature,
      bloodPressure: dto.bloodPressure,
      heartRate: dto.heartRate,
      respiratoryRate: dto.respiratoryRate,
      oxygenSaturation: dto.oxygenSaturation,
      weight: dto.weight,
      height: dto.height,
    };
    form.vitalsRecordedBy = userId ?? null;
    form.vitalsRecordedAt = new Date();
    form.lastUpdatedBy = userId ?? null;

    const saved = await this.dischargeFormRepository.save(form);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'UPDATE',
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
    form.version += 1;

    const savedForm = await this.dischargeFormRepository.save(form);

    // Mark encounter as discharged
    if (form.encounter) {
      form.encounter.status = 'discharged';
      form.encounter.dischargeDate = new Date();
      form.encounter.dischargeDiagnosis = form.dischargeDiagnosis;
      await this.encounterRepository.save(form.encounter);
    }

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'APPROVE',
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
