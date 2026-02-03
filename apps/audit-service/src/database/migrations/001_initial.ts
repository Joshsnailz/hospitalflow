import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial audit_db schema: audit_logs and data_access_logs tables with indexes.
 * For production, run migrations instead of synchronize.
 */
export class InitialAuditSchema001 implements MigrationInterface {
  name = 'InitialAuditSchema001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        user_email VARCHAR(255),
        user_role VARCHAR(50),
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(100),
        resource_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'SUCCESS',
        ip_address VARCHAR(45),
        user_agent TEXT,
        description VARCHAR(500),
        old_values JSONB,
        new_values JSONB,
        metadata JSONB,
        request_id VARCHAR(100),
        session_id VARCHAR(100),
        service_name VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS data_access_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        patient_id UUID,
        patient_mrn VARCHAR(50),
        data_type VARCHAR(100) NOT NULL,
        access_type VARCHAR(20) NOT NULL,
        sensitivity VARCHAR(20) DEFAULT 'PHI',
        record_id VARCHAR(100),
        record_type VARCHAR(100),
        access_reason VARCHAR(500),
        fields_accessed JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        request_id VARCHAR(100),
        session_id VARCHAR(100),
        metadata JSONB,
        emergency_access BOOLEAN DEFAULT FALSE,
        break_glass_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON data_access_logs(user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_data_access_logs_patient_id ON data_access_logs(patient_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_data_access_logs_data_type ON data_access_logs(data_type);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_data_access_logs_access_type ON data_access_logs(access_type);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_data_access_logs_created_at ON data_access_logs(created_at);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_data_access_logs_sensitivity ON data_access_logs(sensitivity);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS data_access_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
  }
}
