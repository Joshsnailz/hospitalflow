import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogEntity } from './entities/audit-log.entity';
import { DataAccessLogEntity } from './entities/data-access-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogEntity, DataAccessLogEntity]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
