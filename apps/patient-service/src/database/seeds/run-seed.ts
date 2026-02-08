import { DataSource } from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { PatientNextOfKinEntity } from '../../patients/entities/patient-next-of-kin.entity';
import { PatientAllergyEntity } from '../../patients/entities/patient-allergy.entity';
import { PatientMedicalHistoryEntity } from '../../patients/entities/patient-medical-history.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.PATIENT_DB_HOST || 'localhost',
  port: parseInt(process.env.PATIENT_DB_PORT || '5432'),
  username: process.env.PATIENT_DB_USER || 'postgres',
  password: process.env.PATIENT_DB_PASSWORD || '',
  database: process.env.PATIENT_DB_NAME || 'patient_db',
  entities: [PatientEntity, PatientNextOfKinEntity, PatientAllergyEntity, PatientMedicalHistoryEntity],
  synchronize: true,
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Patient Service Database connected');

    const patientRepository = dataSource.getRepository(PatientEntity);
    const nokRepository = dataSource.getRepository(PatientNextOfKinEntity);
    const allergyRepository = dataSource.getRepository(PatientAllergyEntity);
    const historyRepository = dataSource.getRepository(PatientMedicalHistoryEntity);

    // Check if patients already exist
    const existingCount = await patientRepository.count();
    if (existingCount > 0) {
      console.log(`Patients already exist (${existingCount}), skipping seed`);
      await dataSource.destroy();
      return;
    }

    console.log('Seeding patient service database...');

    // Create sample patients with valid CHI numbers (format: NPPPPPPPLPP)
    const patients = [
      {
        chiNumber: '70282487G70',
        title: 'Mr',
        firstName: 'Tafadzwa',
        lastName: 'Moyo',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        nationalId: '37-1234567A37',
        email: 'tafadzwa.moyo@email.com',
        phonePrimary: '+263-77-111-2222',
        addressLine1: '123 Samora Machel Avenue',
        city: 'Harare',
        province: 'Harare Province',
        country: 'Zimbabwe',
        isActive: true,
      },
      {
        chiNumber: '81234567H82',
        title: 'Mrs',
        firstName: 'Rudo',
        lastName: 'Ndlovu',
        dateOfBirth: '1985-08-22',
        gender: 'female',
        nationalId: '42-9876543B42',
        email: 'rudo.ndlovu@email.com',
        phonePrimary: '+263-77-333-4444',
        addressLine1: '456 Josiah Tongogara Street',
        city: 'Harare',
        province: 'Harare Province',
        country: 'Zimbabwe',
        isActive: true,
      },
      {
        chiNumber: '92345678K93',
        title: 'Mr',
        firstName: 'Tatenda',
        lastName: 'Chikwamba',
        dateOfBirth: '1978-11-30',
        gender: 'male',
        nationalId: '29-5555555C29',
        email: 'tatenda.chikwamba@email.com',
        phonePrimary: '+263-77-555-6666',
        addressLine1: '789 Robert Mugabe Road',
        city: 'Harare',
        province: 'Harare Province',
        country: 'Zimbabwe',
        isActive: true,
      },
      {
        chiNumber: '63456789M64',
        title: 'Miss',
        firstName: 'Nokuthula',
        lastName: 'Sibanda',
        dateOfBirth: '2000-03-10',
        gender: 'female',
        nationalId: '51-7777777D51',
        email: 'nokuthula.sibanda@email.com',
        phonePrimary: '+263-77-777-8888',
        addressLine1: '321 Mazowe Street',
        city: 'Harare',
        province: 'Harare Province',
        country: 'Zimbabwe',
        isActive: true,
      },
      {
        chiNumber: '54567890P55',
        title: 'Mr',
        firstName: 'Blessing',
        lastName: 'Mutasa',
        dateOfBirth: '1972-12-25',
        gender: 'male',
        nationalId: '19-9999999E19',
        email: 'blessing.mutasa@email.com',
        phonePrimary: '+263-77-999-0000',
        addressLine1: '654 Chinhoyi Street',
        city: 'Harare',
        province: 'Harare Province',
        country: 'Zimbabwe',
        isActive: true,
      },
    ];

    for (const patientData of patients) {
      const patient = patientRepository.create(patientData);
      const savedPatient = await patientRepository.save(patient);
      console.log(`  Created patient: ${patient.firstName} ${patient.lastName} (CHI: ${patient.chiNumber})`);

      // Add next of kin
      const nok = nokRepository.create({
        patientId: savedPatient.id,
        relationship: 'Spouse',
        firstName: 'Contact',
        lastName: `for ${patient.lastName}`,
        phonePrimary: `+263-77-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10000)}`,
        isPrimary: true,
        isEmergencyContact: true,
      });
      await nokRepository.save(nok);

      // Add a common allergy for some patients
      if (Math.random() > 0.5) {
        const allergy = allergyRepository.create({
          patientId: savedPatient.id,
          allergyType: 'drug',
          allergen: 'Penicillin',
          reaction: 'Rash and swelling',
          severity: 'moderate',
          isConfirmed: true,
        });
        await allergyRepository.save(allergy);
      }

      // Add medical history for some patients
      if (Math.random() > 0.6) {
        const history = historyRepository.create({
          patientId: savedPatient.id,
          conditionType: 'chronic',
          conditionName: 'Hypertension',
          isCurrent: true,
          severity: 'mild',
        });
        await historyRepository.save(history);
      }
    }

    console.log(`\nSeeded ${patients.length} patients successfully`);
    await dataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
