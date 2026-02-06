import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagingController } from './imaging.controller';
import { ImagingService } from './imaging.service';
import { ImagingRequestEntity } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImagingRequestEntity]),
  ],
  controllers: [ImagingController],
  providers: [ImagingService],
  exports: [ImagingService],
})
export class ImagingModule {}
