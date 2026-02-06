import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncountersController } from './encounters.controller';
import { EncountersService } from './encounters.service';
import { EncounterEntity, ClinicalNoteEntity } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([EncounterEntity, ClinicalNoteEntity]),
  ],
  controllers: [EncountersController],
  providers: [EncountersService],
  exports: [EncountersService],
})
export class EncountersModule {}
