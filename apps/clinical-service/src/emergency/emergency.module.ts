import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';
import { EmergencyVisitEntity } from './entities';
import { EncountersModule } from '../encounters/encounters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmergencyVisitEntity]),
    EncountersModule,
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService],
  exports: [EmergencyService],
})
export class EmergencyModule {}
