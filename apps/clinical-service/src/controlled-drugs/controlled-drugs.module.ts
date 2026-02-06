import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlledDrugsController } from './controlled-drugs.controller';
import { ControlledDrugsService } from './controlled-drugs.service';
import { ControlledDrugEntryEntity } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([ControlledDrugEntryEntity]),
  ],
  controllers: [ControlledDrugsController],
  providers: [ControlledDrugsService],
  exports: [ControlledDrugsService],
})
export class ControlledDrugsModule {}
