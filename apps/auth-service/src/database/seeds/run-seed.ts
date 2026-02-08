import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
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

// Function to publish user.created event
async function publishUserCreatedEvent(
  channel: amqp.Channel,
  user: UserEntity,
): Promise<void> {
  const event = {
    eventId: uuidv4(),
    eventType: 'user.created',
    timestamp: new Date().toISOString(),
    correlationId: uuidv4(),
    source: 'auth-service',
    version: '1.0',
    payload: {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phoneNumber: user.phoneNumber || undefined,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt.toISOString(),
    },
  };

  const message = Buffer.from(JSON.stringify(event));
  channel.publish('clinical.events', 'user.created', message, {
    persistent: true,
    contentType: 'application/json',
  });
  console.log(`  📨 Published user.created event for ${user.email}`);
}

// Function to publish audit log event
async function publishAuditLogEvent(
  channel: amqp.Channel,
  user: UserEntity,
  action: string,
  resource: string,
): Promise<void> {
  const event = {
    eventId: uuidv4(),
    eventType: 'audit.log',
    timestamp: new Date().toISOString(),
    correlationId: uuidv4(),
    source: 'auth-service',
    version: '1.0',
    payload: {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: action,
      resource: resource,
      resourceId: user.id,
      status: 'success',
    },
  };

  const message = Buffer.from(JSON.stringify(event));
  channel.publish('clinical.audit', 'audit.log', message, {
    persistent: true,
    contentType: 'application/json',
  });
  console.log(`  📋 Published audit log: ${action} on ${resource} by ${user.email}`);
}

async function seed() {
  let rabbitmqConnection: amqp.Connection | null = null;
  let rabbitmqChannel: amqp.Channel | null = null;

  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Connect to RabbitMQ
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://clinical_user:clinical_password@localhost:5672/clinical_portal';
      rabbitmqConnection = await amqp.connect(rabbitmqUrl);
      rabbitmqChannel = await rabbitmqConnection.createChannel();
      await rabbitmqChannel.assertExchange('clinical.events', 'topic', { durable: true });
      await rabbitmqChannel.assertExchange('clinical.audit', 'direct', { durable: true });
      console.log('RabbitMQ connected');
    } catch (error) {
      console.warn('⚠️  RabbitMQ connection failed - events will not be published');
      console.warn('   User-service will need manual seeding');
    }

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
    if (rabbitmqChannel) {
      await publishUserCreatedEvent(rabbitmqChannel, adminUser);
      await publishAuditLogEvent(rabbitmqChannel, adminUser, 'REGISTER', 'user');
    }

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
    if (rabbitmqChannel) {
      await publishUserCreatedEvent(rabbitmqChannel, doctorUser);
      await publishAuditLogEvent(rabbitmqChannel, doctorUser, 'REGISTER', 'user');
    }

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
    if (rabbitmqChannel) {
      await publishUserCreatedEvent(rabbitmqChannel, clinicalAdminUser);
      await publishAuditLogEvent(rabbitmqChannel, clinicalAdminUser, 'REGISTER', 'user');
    }

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
    if (rabbitmqChannel) {
      await publishUserCreatedEvent(rabbitmqChannel, nurseUser);
      await publishAuditLogEvent(rabbitmqChannel, nurseUser, 'REGISTER', 'user');
    }

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
    if (rabbitmqChannel) {
      await publishUserCreatedEvent(rabbitmqChannel, pharmacistUser);
      await publishAuditLogEvent(rabbitmqChannel, pharmacistUser, 'REGISTER', 'user');
    }

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
    if (rabbitmqChannel) {
      await publishUserCreatedEvent(rabbitmqChannel, consultantUser);
      await publishAuditLogEvent(rabbitmqChannel, consultantUser, 'REGISTER', 'user');
    }

    // Add more doctors for testing
    const additionalDoctors = [
      { email: 'doctor2@clinical-portal.com', firstName: 'Maria', lastName: 'Chikwanha', department: 'Paediatrics' },
      { email: 'doctor3@clinical-portal.com', firstName: 'James', lastName: 'Sibanda', department: 'Surgery' },
      { email: 'doctor4@clinical-portal.com', firstName: 'Elizabeth', lastName: 'Mangwende', department: 'Emergency Medicine' },
      { email: 'doctor5@clinical-portal.com', firstName: 'David', lastName: 'Ncube', department: 'Obstetrics & Gynaecology' },
    ];

    for (const docData of additionalDoctors) {
      const docHash = await bcrypt.hash('Doctor123!', 12);
      const doctor = userRepository.create({
        email: docData.email,
        passwordHash: docHash,
        firstName: docData.firstName,
        lastName: docData.lastName,
        role: 'doctor',
        isActive: true,
        isEmailVerified: true,
      });
      await userRepository.save(doctor);
      console.log(`Doctor created: ${doctor.email}`);
      if (rabbitmqChannel) {
        await publishUserCreatedEvent(rabbitmqChannel, doctor);
        await publishAuditLogEvent(rabbitmqChannel, doctor, 'REGISTER', 'user');
      }
    }

    console.log('\n✅ Seed completed successfully');
    console.log('📊 Total users created: 10 (1 admin, 6 doctors, 1 nurse, 1 pharmacist, 1 consultant)');

    if (rabbitmqChannel) {
      console.log('📨 All user.created events published to RabbitMQ');
      console.log('   User-service should automatically sync these users');
      await rabbitmqChannel.close();
    }

    if (rabbitmqConnection) {
      await rabbitmqConnection.close();
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
