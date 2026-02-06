import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DischargeController } from './discharge.controller';
import { DischargeService } from './discharge.service';
import { DischargeFormEntity } from './entities';
import { EncounterEntity } from '../encounters/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([DischargeFormEntity, EncounterEntity]),
  ],
  controllers: [DischargeController],
  providers: [DischargeService],
  exports: [DischargeService],
})
export class DischargeModule {}
