import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionEntity } from './entities/action.entity';
import { CreateActionDto } from './dto';

@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(ActionEntity)
    private readonly actionRepository: Repository<ActionEntity>,
  ) {}

  async create(createActionDto: CreateActionDto): Promise<ActionEntity> {
    const existing = await this.actionRepository.findOne({
      where: { name: createActionDto.name },
    });

    if (existing) {
      throw new ConflictException(`Action '${createActionDto.name}' already exists`);
    }

    const action = this.actionRepository.create(createActionDto);
    return this.actionRepository.save(action);
  }

  async findAll(): Promise<ActionEntity[]> {
    return this.actionRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ActionEntity> {
    const action = await this.actionRepository.findOne({ where: { id } });

    if (!action) {
      throw new NotFoundException(`Action with ID '${id}' not found`);
    }

    return action;
  }

  async findByName(name: string): Promise<ActionEntity> {
    const action = await this.actionRepository.findOne({ where: { name } });

    if (!action) {
      throw new NotFoundException(`Action '${name}' not found`);
    }

    return action;
  }
}
