import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceEntity } from './entities/resource.entity';
import { CreateResourceDto } from './dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(ResourceEntity)
    private readonly resourceRepository: Repository<ResourceEntity>,
  ) {}

  async create(createResourceDto: CreateResourceDto): Promise<ResourceEntity> {
    const existing = await this.resourceRepository.findOne({
      where: { name: createResourceDto.name },
    });

    if (existing) {
      throw new ConflictException(`Resource '${createResourceDto.name}' already exists`);
    }

    const resource = this.resourceRepository.create(createResourceDto);
    return this.resourceRepository.save(resource);
  }

  async findAll(): Promise<ResourceEntity[]> {
    return this.resourceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ResourceEntity> {
    const resource = await this.resourceRepository.findOne({ where: { id } });

    if (!resource) {
      throw new NotFoundException(`Resource with ID '${id}' not found`);
    }

    return resource;
  }

  async findByName(name: string): Promise<ResourceEntity> {
    const resource = await this.resourceRepository.findOne({ where: { name } });

    if (!resource) {
      throw new NotFoundException(`Resource '${name}' not found`);
    }

    return resource;
  }
}
