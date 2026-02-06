import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('HOSPITAL_SERVICE_URL', 'http://localhost:3007'),
        timeout: 10000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
