import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../users/entities/user.entity';
import { RefreshTokenEntity } from '../../auth/entities/refresh-token.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.AUTH_DB_HOST || 'localhost',
  port: parseInt(process.env.AUTH_DB_PORT || '5432'),
  username: process.env.AUTH_DB_USER || 'clinical_user',
  password: process.env.AUTH_DB_PASSWORD || 'clinical_password',
  database: process.env.AUTH_DB_NAME || 'auth_db',
  entities: [UserEntity, RefreshTokenEntity],
  synchronize: true,
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    const userRepository = dataSource.getRepository(UserEntity);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@clinical-portal.com' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping seed');
      await dataSource.destroy();
      return;
    }

    // Create default admin user
    const passwordHash = await bcrypt.hash('Admin123!', 12);

    const adminUser = userRepository.create({
      email: 'admin@clinical-portal.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super_admin',
      isActive: true,
      isEmailVerified: true,
    });

    await userRepository.save(adminUser);
    console.log('Admin user created: admin@clinical-portal.com / Admin123!');

    // Create a test doctor user
    const doctorPasswordHash = await bcrypt.hash('Doctor123!', 12);

    const doctorUser = userRepository.create({
      email: 'doctor@clinical-portal.com',
      passwordHash: doctorPasswordHash,
      firstName: 'John',
      lastName: 'Smith',
      role: 'doctor',
      isActive: true,
      isEmailVerified: true,
    });

    await userRepository.save(doctorUser);
    console.log('Doctor user created: doctor@clinical-portal.com / Doctor123!');

    // Create a clinical admin user
    const clinicalAdminHash = await bcrypt.hash('ClinAdmin123!', 12);
    const clinicalAdminUser = userRepository.create({
      email: 'clinicaladmin@clinical-portal.com',
      passwordHash: clinicalAdminHash,
      firstName: 'Sarah',
      lastName: 'Moyo',
      role: 'clinical_admin',
      isActive: true,
      isEmailVerified: true,
    });
    await userRepository.save(clinicalAdminUser);
    console.log('Clinical Admin created: clinicaladmin@clinical-portal.com / ClinAdmin123!');

    // Create a nurse user
    const nurseHash = await bcrypt.hash('Nurse123!', 12);
    const nurseUser = userRepository.create({
      email: 'nurse@clinical-portal.com',
      passwordHash: nurseHash,
      firstName: 'Grace',
      lastName: 'Ndlovu',
      role: 'nurse',
      isActive: true,
      isEmailVerified: true,
    });
    await userRepository.save(nurseUser);
    console.log('Nurse created: nurse@clinical-portal.com / Nurse123!');

    // Create a pharmacist user
    const pharmacistHash = await bcrypt.hash('Pharma123!', 12);
    const pharmacistUser = userRepository.create({
      email: 'pharmacist@clinical-portal.com',
      passwordHash: pharmacistHash,
      firstName: 'Tendai',
      lastName: 'Chirwa',
      role: 'hospital_pharmacist',
      isActive: true,
      isEmailVerified: true,
    });
    await userRepository.save(pharmacistUser);
    console.log('Pharmacist created: pharmacist@clinical-portal.com / Pharma123!');

    // Create a consultant user
    const consultantHash = await bcrypt.hash('Consult123!', 12);
    const consultantUser = userRepository.create({
      email: 'consultant@clinical-portal.com',
      passwordHash: consultantHash,
      firstName: 'Tatenda',
      lastName: 'Mutasa',
      role: 'consultant',
      isActive: true,
      isEmailVerified: true,
    });
    await userRepository.save(consultantUser);
    console.log('Consultant created: consultant@clinical-portal.com / Consult123!');

    console.log('Seed completed successfully');
    await dataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
