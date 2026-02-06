import { DataSource } from 'typeorm';
import { HospitalEntity } from '../../hospitals/entities/hospital.entity';
import { DepartmentEntity } from '../../hospitals/entities/department.entity';
import { WardEntity } from '../../hospitals/entities/ward.entity';
import { BedEntity } from '../../hospitals/entities/bed.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.HOSPITAL_DB_HOST || 'localhost',
  port: parseInt(process.env.HOSPITAL_DB_PORT || '5432', 10),
  username: process.env.HOSPITAL_DB_USER || 'postgres',
  password: process.env.HOSPITAL_DB_PASSWORD || '',
  database: process.env.HOSPITAL_DB_NAME || 'hospital_db',
  entities: [HospitalEntity, DepartmentEntity, WardEntity, BedEntity],
  synchronize: true,
});

interface WardSeedConfig {
  name: string;
  wardType: string;
  bedCount: number;
  bedType: string;
}

interface DepartmentSeedConfig {
  name: string;
  departmentType: string;
  wards: WardSeedConfig[];
}

async function runSeed() {
  console.log('Connecting to database...');
  await dataSource.initialize();
  console.log('Database connected.');

  const hospitalRepo = dataSource.getRepository(HospitalEntity);
  const departmentRepo = dataSource.getRepository(DepartmentEntity);
  const wardRepo = dataSource.getRepository(WardEntity);
  const bedRepo = dataSource.getRepository(BedEntity);

  // Check if hospital already exists
  const existingHospital = await hospitalRepo.findOne({
    where: { name: 'Parirenyatwa Group of Hospitals' },
  });

  if (existingHospital) {
    console.log('Seed data already exists. Skipping...');
    await dataSource.destroy();
    return;
  }

  console.log('Seeding hospital data...');

  // Create the hospital
  const hospital = hospitalRepo.create({
    name: 'Parirenyatwa Group of Hospitals',
    description:
      'One of the largest referral hospitals in Zimbabwe, located in Harare. It serves as the main teaching hospital for the University of Zimbabwe College of Health Sciences.',
    facilityType: 'hospital',
    addressLine1: 'Mazowe Street',
    city: 'Harare',
    province: 'Harare Province',
    country: 'Zimbabwe',
    phonePrimary: '+263-4-701631',
    phoneEmergency: '+263-4-701632',
    email: 'info@parirenyatwa.co.zw',
    isActive: true,
  });

  const savedHospital = await hospitalRepo.save(hospital);
  console.log(`Created hospital: ${savedHospital.name}`);

  // Define departments with their wards
  const departmentConfigs: DepartmentSeedConfig[] = [
    {
      name: 'General Medicine',
      departmentType: 'clinical',
      wards: [
        { name: 'General Ward A', wardType: 'general', bedCount: 20, bedType: 'standard' },
        { name: 'ICU - Medicine', wardType: 'icu', bedCount: 8, bedType: 'icu' },
      ],
    },
    {
      name: 'Surgery',
      departmentType: 'clinical',
      wards: [
        { name: 'Surgical Ward A', wardType: 'surgical', bedCount: 16, bedType: 'standard' },
        { name: 'ICU - Surgical', wardType: 'icu', bedCount: 8, bedType: 'icu' },
      ],
    },
    {
      name: 'Paediatrics',
      departmentType: 'clinical',
      wards: [
        { name: 'Paediatric Ward A', wardType: 'paediatric', bedCount: 16, bedType: 'standard' },
        { name: 'Paediatric Ward B', wardType: 'paediatric', bedCount: 16, bedType: 'crib' },
      ],
    },
    {
      name: 'Obstetrics & Gynaecology',
      departmentType: 'clinical',
      wards: [
        { name: 'Maternity Ward A', wardType: 'maternity', bedCount: 24, bedType: 'standard' },
        { name: 'Maternity Ward B', wardType: 'maternity', bedCount: 24, bedType: 'standard' },
      ],
    },
    {
      name: 'Emergency Medicine',
      departmentType: 'clinical',
      wards: [
        { name: 'Emergency Ward', wardType: 'general', bedCount: 20, bedType: 'standard' },
      ],
    },
    {
      name: 'Pharmacy',
      departmentType: 'support',
      wards: [],
    },
    {
      name: 'Radiology',
      departmentType: 'support',
      wards: [],
    },
  ];

  for (const deptConfig of departmentConfigs) {
    const department = departmentRepo.create({
      hospitalId: savedHospital.id,
      name: deptConfig.name,
      departmentType: deptConfig.departmentType,
      isActive: true,
    });

    const savedDepartment = await departmentRepo.save(department);
    console.log(`  Created department: ${savedDepartment.name}`);

    for (const wardConfig of deptConfig.wards) {
      const ward = wardRepo.create({
        departmentId: savedDepartment.id,
        name: wardConfig.name,
        wardType: wardConfig.wardType,
        totalBeds: wardConfig.bedCount,
        isActive: true,
      });

      const savedWard = await wardRepo.save(ward);
      console.log(`    Created ward: ${savedWard.name} (${wardConfig.bedCount} beds)`);

      // Create beds for the ward
      for (let i = 1; i <= wardConfig.bedCount; i++) {
        const bedNumber = `${savedWard.name.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`;
        const bed = bedRepo.create({
          wardId: savedWard.id,
          bedNumber,
          bedType: wardConfig.bedType,
          status: 'available',
          isActive: true,
        });

        await bedRepo.save(bed);
      }
      console.log(`      Created ${wardConfig.bedCount} beds`);
    }
  }

  console.log('\nSeed data created successfully!');

  // Print summary
  const hospitalCount = await hospitalRepo.count();
  const departmentCount = await departmentRepo.count();
  const wardCount = await wardRepo.count();
  const bedCount = await bedRepo.count();

  console.log(`\nSummary:`);
  console.log(`  Hospitals: ${hospitalCount}`);
  console.log(`  Departments: ${departmentCount}`);
  console.log(`  Wards: ${wardCount}`);
  console.log(`  Beds: ${bedCount}`);

  await dataSource.destroy();
  console.log('\nDatabase connection closed.');
}

runSeed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
