/**
 * Seed script: 100 realistic mock patients with related records
 * (next-of-kin, medical history, allergies, medical aid).
 *
 * Run standalone:
 *   npx ts-node -r tsconfig-paths/register apps/patient-service/src/seed/seed-patients.ts
 *
 * Or via Docker:
 *   docker exec -i clinical-portal-patient-db psql -U clinical_user -d patient_db < seed.sql
 *
 * The module also exports `seedPatients(dataSource)` so it can be
 * called programmatically from the NestJS app (e.g. a CLI command).
 */

import { DataSource } from 'typeorm';
import { PatientEntity } from '../patients/entities/patient.entity';
import { PatientNextOfKinEntity } from '../patients/entities/patient-next-of-kin.entity';
import { PatientMedicalHistoryEntity } from '../patients/entities/patient-medical-history.entity';
import { PatientAllergyEntity } from '../patients/entities/patient-allergy.entity';
import { PatientMedicalAidEntity } from '../patients/entities/patient-medical-aid.entity';

// ─── Helpers ───────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

/** Generate a CHI-style number: DDMMYY + 4 random digits */
function makeChi(dob: Date): string {
  const dd = pad(dob.getDate());
  const mm = pad(dob.getMonth() + 1);
  const yy = pad(dob.getFullYear() % 100);
  const seq = pad(randInt(1000, 9999), 4);
  return `${dd}${mm}${yy}${seq}`;
}

function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─── Data pools ────────────────────────────────────────────────────

const FIRST_NAMES_M = [
  'James', 'Robert', 'John', 'David', 'William', 'Thomas', 'Andrew', 'Daniel',
  'Michael', 'Christopher', 'Matthew', 'Joseph', 'Richard', 'Charles', 'Mark',
  'Steven', 'Paul', 'Kevin', 'Brian', 'George', 'Patrick', 'Sean', 'Ian',
  'Craig', 'Stuart', 'Callum', 'Fraser', 'Hamish', 'Angus', 'Ewan',
  'Liam', 'Ross', 'Gavin', 'Douglas', 'Malcolm', 'Finlay', 'Gregor',
  'Tendai', 'Tatenda', 'Takudzwa', 'Farai', 'Tinashe', 'Kudakwashe',
  'Blessing', 'Simbarashe', 'Tanaka', 'Munashe', 'Tinotenda',
];

const FIRST_NAMES_F = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Margaret', 'Susan',
  'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Helen', 'Sandra', 'Sharon',
  'Laura', 'Emma', 'Olivia', 'Fiona', 'Isla', 'Eilidh', 'Morag', 'Catriona',
  'Aileen', 'Kirsty', 'Heather', 'Mhairi', 'Mairi', 'Shona', 'Rhona',
  'Rudo', 'Tsitsi', 'Rumbidzai', 'Nyasha', 'Chiedza', 'Tariro',
  'Rutendo', 'Tendai', 'Chenai', 'Anesu', 'Makanaka',
];

const LAST_NAMES = [
  'Smith', 'Brown', 'Wilson', 'Campbell', 'Stewart', 'Thomson', 'Robertson',
  'Anderson', 'MacDonald', 'Scott', 'Reid', 'Murray', 'Taylor', 'Clark',
  'Mitchell', 'Ross', 'Walker', 'Paterson', 'Young', 'Watson', 'Morrison',
  'Fraser', 'Hamilton', 'Graham', 'Henderson', 'Kerr', 'Duncan', 'Ferguson',
  'Hunter', 'Simpson', 'Wallace', 'Crawford', 'Cunningham', 'MacLeod',
  'Moyo', 'Ncube', 'Ndlovu', 'Sibanda', 'Dube', 'Nyoni', 'Mpofu',
  'Nkomo', 'Tshuma', 'Banda', 'Phiri', 'Zimuto', 'Chikwanha', 'Mutasa',
  'Chirwa', 'Maposa',
];

const CITIES = [
  'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'Stirling',
  'Perth', 'Ayr', 'Falkirk', 'Livingston', 'Dunfermline', 'Paisley',
  'Kilmarnock', 'Greenock', 'Cumbernauld', 'East Kilbride', 'Hamilton',
  'Kirkcaldy', 'Motherwell', 'Coatbridge',
];

const COUNTIES = [
  'Midlothian', 'City of Edinburgh', 'Glasgow City', 'Aberdeenshire',
  'Highland', 'Fife', 'Perth and Kinross', 'South Ayrshire', 'Falkirk',
  'West Lothian', 'Renfrewshire', 'North Lanarkshire', 'South Lanarkshire',
  'Angus', 'Stirling', 'Dundee City', 'East Lothian', 'Scottish Borders',
];

const STREETS = [
  'High Street', 'Main Street', 'Castle Road', 'Church Lane', 'Victoria Street',
  'Queen Street', 'George Street', 'Princes Street', 'Rose Street', 'Thistle Lane',
  'Elm Drive', 'Oak Avenue', 'Maple Close', 'Birch Way', 'Heather Court',
  'Loch View', 'Glen Road', 'Brae Terrace', 'Burns Avenue', 'Scott Crescent',
];

const GP_FIRST = ['Dr. Alan', 'Dr. Sarah', 'Dr. Fiona', 'Dr. James', 'Dr. Karen', 'Dr. Neil', 'Dr. Morag', 'Dr. Graham', 'Dr. Helen', 'Dr. Andrew'];
const GP_LAST = ['MacKenzie', 'Campbell', 'Stewart', 'Murray', 'Ross', 'Henderson', 'Thomson', 'Mitchell', 'Fraser', 'Paterson'];
const GP_PRACTICES = [
  'Lothian Medical Practice', 'Riverside Health Centre', 'Craigmillar Surgery',
  'Stockbridge Medical Centre', 'Gorgie Medical Practice', 'Leith Walk Surgery',
  'Morningside Health Centre', 'Bruntsfield Medical Practice', 'Portobello Surgery',
  'Corstorphine Medical Centre', 'Tollcross Health Centre', 'Marchmont Surgery',
];

const NATIONALITIES = ['British', 'Scottish', 'Irish', 'Polish', 'Indian', 'Pakistani', 'Zimbabwean', 'South African', 'Nigerian', 'Chinese'];
const ETHNICITIES = ['White Scottish', 'White British', 'White Irish', 'White Other', 'Black African', 'Asian Indian', 'Asian Pakistani', 'Mixed', 'Chinese', 'Other'];
const LANGUAGES = ['English', 'English', 'English', 'English', 'Scots Gaelic', 'Polish', 'Urdu', 'Shona', 'Punjabi', 'Mandarin'];

const MEDICAL_AID_PROVIDERS = [
  'BUPA', 'AXA Health', 'Aviva Health', 'Vitality Health', 'WPA',
  'Cigna Healthcare', 'Freedom Health Insurance', 'The Exeter',
  'National Friendly', 'Benenden Health',
];

const MEDICAL_AID_PLANS = [
  'Comprehensive Plus', 'Essential Cover', 'Premium Choice', 'Gold Plan',
  'Silver Plan', 'Family Cover', 'Individual Standard', 'Corporate Plan',
];

const ALLERGY_DRUGS = ['Penicillin', 'Amoxicillin', 'Aspirin', 'Ibuprofen', 'Codeine', 'Sulfonamides', 'Cephalosporins', 'Erythromycin', 'Tetracycline', 'Morphine'];
const ALLERGY_FOODS = ['Peanuts', 'Tree Nuts', 'Shellfish', 'Eggs', 'Milk', 'Wheat', 'Soy', 'Fish', 'Sesame'];
const ALLERGY_ENV = ['Pollen', 'Dust Mites', 'Pet Dander', 'Mould', 'Latex', 'Bee Stings', 'Wasp Stings', 'Nickel'];
const ALLERGY_REACTIONS = [
  'Rash and hives', 'Anaphylaxis', 'Swelling of lips and tongue', 'Difficulty breathing',
  'Nausea and vomiting', 'Itching', 'Skin irritation', 'Abdominal pain',
  'Runny nose and sneezing', 'Tightness in chest',
];

const CONDITIONS = [
  { title: 'Type 2 Diabetes Mellitus', icd: 'E11', status: 'chronic' as const },
  { title: 'Essential Hypertension', icd: 'I10', status: 'chronic' as const },
  { title: 'Asthma', icd: 'J45', status: 'active' as const },
  { title: 'Chronic Obstructive Pulmonary Disease', icd: 'J44', status: 'chronic' as const },
  { title: 'Major Depressive Disorder', icd: 'F32', status: 'active' as const },
  { title: 'Generalised Anxiety Disorder', icd: 'F41.1', status: 'active' as const },
  { title: 'Osteoarthritis', icd: 'M15', status: 'chronic' as const },
  { title: 'Hypothyroidism', icd: 'E03', status: 'chronic' as const },
  { title: 'Gastro-oesophageal Reflux Disease', icd: 'K21', status: 'active' as const },
  { title: 'Atrial Fibrillation', icd: 'I48', status: 'chronic' as const },
  { title: 'Heart Failure', icd: 'I50', status: 'chronic' as const },
  { title: 'Chronic Kidney Disease Stage 3', icd: 'N18.3', status: 'chronic' as const },
  { title: 'Iron Deficiency Anaemia', icd: 'D50', status: 'active' as const },
  { title: 'Epilepsy', icd: 'G40', status: 'chronic' as const },
  { title: 'Migraine', icd: 'G43', status: 'active' as const },
  { title: 'Rheumatoid Arthritis', icd: 'M06', status: 'chronic' as const },
  { title: 'Coeliac Disease', icd: 'K90.0', status: 'chronic' as const },
  { title: 'Psoriasis', icd: 'L40', status: 'chronic' as const },
  { title: 'Eczema', icd: 'L30', status: 'active' as const },
  { title: 'Chronic Lower Back Pain', icd: 'M54.5', status: 'chronic' as const },
];

const SURGERIES = [
  { title: 'Appendectomy', icd: null },
  { title: 'Cholecystectomy', icd: null },
  { title: 'Tonsillectomy', icd: null },
  { title: 'Total Knee Replacement', icd: null },
  { title: 'Total Hip Replacement', icd: null },
  { title: 'Caesarean Section', icd: null },
  { title: 'Cataract Surgery', icd: null },
  { title: 'Hernia Repair', icd: null },
  { title: 'Coronary Artery Bypass Graft', icd: null },
  { title: 'Carpal Tunnel Release', icd: null },
];

const NOK_RELATIONSHIPS: Array<'spouse' | 'parent' | 'child' | 'sibling' | 'partner' | 'friend'> = [
  'spouse', 'parent', 'child', 'sibling', 'partner', 'friend',
];

// ─── Builder functions ─────────────────────────────────────────────

function buildPatient(index: number): Partial<PatientEntity> {
  const isMale = Math.random() > 0.5;
  const firstName = pick(isMale ? FIRST_NAMES_M : FIRST_NAMES_F);
  const lastName = pick(LAST_NAMES);
  const middleName = Math.random() > 0.6 ? pick(isMale ? FIRST_NAMES_M : FIRST_NAMES_F) : null;
  const dob = randomDate(1940, 2010);
  const chi = makeChi(dob);
  const city = pick(CITIES);
  const county = pick(COUNTIES);
  const postCode = `EH${randInt(1, 17)} ${randInt(1, 9)}${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}`;
  const gpFirst = pick(GP_FIRST);
  const gpLast = pick(GP_LAST);

  return {
    chiNumber: chi,
    firstName,
    lastName,
    middleName,
    dateOfBirth: dob,
    gender: isMale ? 'male' : 'female',
    maritalStatus: pick(['single', 'married', 'divorced', 'widowed', 'separated', 'unknown']),
    nationality: pick(NATIONALITIES),
    ethnicity: pick(ETHNICITIES),
    preferredLanguage: pick(LANGUAGES),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@email.com`,
    phonePrimary: `07${randInt(100, 999)}${randInt(100000, 999999)}`,
    phoneSecondary: Math.random() > 0.6 ? `01${randInt(131, 899)}${randInt(100000, 999999)}` : null,
    addressLine1: `${randInt(1, 200)} ${pick(STREETS)}`,
    addressLine2: Math.random() > 0.5 ? `Flat ${randInt(1, 20)}` : null,
    city,
    county,
    postCode,
    country: 'United Kingdom',
    gpName: `${gpFirst} ${gpLast}`,
    gpPracticeName: pick(GP_PRACTICES),
    gpPracticeAddress: `${randInt(1, 100)} ${pick(STREETS)}, ${city}, ${postCode}`,
    gpPhone: `0131${randInt(200, 999)}${randInt(1000, 9999)}`,
    gpEmail: `reception@${gpLast.toLowerCase()}practice.nhs.uk`,
    isActive: true,
    notes: null,
  };
}

function buildNextOfKin(patientId: string): Partial<PatientNextOfKinEntity> {
  const isMale = Math.random() > 0.5;
  return {
    patientId,
    firstName: pick(isMale ? FIRST_NAMES_M : FIRST_NAMES_F),
    lastName: pick(LAST_NAMES),
    relationship: pick(NOK_RELATIONSHIPS),
    phonePrimary: `07${randInt(100, 999)}${randInt(100000, 999999)}`,
    phoneSecondary: Math.random() > 0.7 ? `01${randInt(131, 899)}${randInt(100000, 999999)}` : null,
    email: Math.random() > 0.4 ? `nok${randInt(1, 9999)}@email.com` : null,
    addressLine1: Math.random() > 0.5 ? `${randInt(1, 200)} ${pick(STREETS)}` : null,
    city: Math.random() > 0.5 ? pick(CITIES) : null,
    postCode: Math.random() > 0.5 ? `EH${randInt(1, 17)} ${randInt(1, 9)}${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}` : null,
    isPrimaryContact: true,
    isEmergencyContact: true,
    isActive: true,
  };
}

function buildMedicalHistory(patientId: string): Partial<PatientMedicalHistoryEntity> {
  const isCondition = Math.random() > 0.3;
  if (isCondition) {
    const cond = pick(CONDITIONS);
    return {
      patientId,
      type: 'condition',
      title: cond.title,
      icdCode: cond.icd,
      status: cond.status,
      onsetDate: randomDate(2005, 2024),
      diagnosedBy: `${pick(GP_FIRST)} ${pick(GP_LAST)}`,
      isActive: true,
    };
  }
  const surg = pick(SURGERIES);
  const surgDate = randomDate(2000, 2024);
  return {
    patientId,
    type: 'surgery',
    title: surg.title,
    status: 'resolved',
    onsetDate: surgDate,
    resolutionDate: new Date(surgDate.getTime() + randInt(1, 30) * 86400000),
    isActive: true,
  };
}

function buildAllergy(patientId: string): Partial<PatientAllergyEntity> {
  const type = pick(['drug', 'food', 'environmental'] as const);
  let allergen: string;
  if (type === 'drug') allergen = pick(ALLERGY_DRUGS);
  else if (type === 'food') allergen = pick(ALLERGY_FOODS);
  else allergen = pick(ALLERGY_ENV);

  return {
    patientId,
    allergenName: allergen,
    allergyType: type,
    severity: pick(['mild', 'moderate', 'severe', 'life_threatening']),
    reaction: pick(ALLERGY_REACTIONS),
    onsetDate: Math.random() > 0.5 ? randomDate(2000, 2023) : null,
    status: 'active',
    isActive: true,
  };
}

function buildMedicalAid(patientId: string): Partial<PatientMedicalAidEntity> {
  const effectiveDate = randomDate(2020, 2025);
  const expiryDate = new Date(effectiveDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + randInt(1, 3));
  return {
    patientId,
    providerName: pick(MEDICAL_AID_PROVIDERS),
    planName: pick(MEDICAL_AID_PLANS),
    membershipNumber: `MEM${randInt(100000, 999999)}`,
    groupNumber: Math.random() > 0.5 ? `GRP${randInt(1000, 9999)}` : null,
    policyHolderName: Math.random() > 0.4 ? `${pick(FIRST_NAMES_M)} ${pick(LAST_NAMES)}` : null,
    policyHolderRelationship: Math.random() > 0.5 ? pick(['self', 'spouse', 'parent']) : null,
    effectiveDate,
    expiryDate,
    status: expiryDate > new Date() ? 'active' : 'expired',
    isPrimary: true,
    contactPhone: `0800${randInt(100, 999)}${randInt(1000, 9999)}`,
    isActive: true,
  };
}

// ─── Main seeder ───────────────────────────────────────────────────

export async function seedPatients(dataSource: DataSource): Promise<void> {
  const patientRepo = dataSource.getRepository(PatientEntity);
  const nokRepo = dataSource.getRepository(PatientNextOfKinEntity);
  const historyRepo = dataSource.getRepository(PatientMedicalHistoryEntity);
  const allergyRepo = dataSource.getRepository(PatientAllergyEntity);
  const medAidRepo = dataSource.getRepository(PatientMedicalAidEntity);

  // Check for existing patients to avoid duplicating
  const existing = await patientRepo.count();
  if (existing >= 100) {
    console.log(`Already ${existing} patients in database — skipping seed.`);
    return;
  }

  console.log('Seeding 100 patients...');

  const usedChis = new Set<string>();

  for (let i = 0; i < 100; i++) {
    const patientData = buildPatient(i);

    // Ensure unique CHI
    while (usedChis.has(patientData.chiNumber!)) {
      patientData.chiNumber = makeChi(patientData.dateOfBirth!);
    }
    usedChis.add(patientData.chiNumber!);

    const patient = patientRepo.create(patientData);
    const saved = await patientRepo.save(patient);

    // ~75% get next-of-kin (1-2 entries)
    if (Math.random() < 0.75) {
      const nokCount = randInt(1, 2);
      for (let n = 0; n < nokCount; n++) {
        const nok = nokRepo.create(buildNextOfKin(saved.id));
        if (n > 0) nok.isPrimaryContact = false;
        await nokRepo.save(nok);
      }
    }

    // ~55% get medical history (1-3 entries)
    if (Math.random() < 0.55) {
      const histCount = randInt(1, 3);
      for (let h = 0; h < histCount; h++) {
        const hist = historyRepo.create(buildMedicalHistory(saved.id));
        await historyRepo.save(hist);
      }
    }

    // ~40% get allergies (1-2 entries)
    if (Math.random() < 0.4) {
      const allergyCount = randInt(1, 2);
      for (let a = 0; a < allergyCount; a++) {
        const allergy = allergyRepo.create(buildAllergy(saved.id));
        await allergyRepo.save(allergy);
      }
    }

    // ~30% get medical aid
    if (Math.random() < 0.3) {
      const aid = medAidRepo.create(buildMedicalAid(saved.id));
      await medAidRepo.save(aid);
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  Seeded ${i + 1}/100 patients`);
    }
  }

  const [total, nokTotal, histTotal, allergyTotal, aidTotal] = await Promise.all([
    patientRepo.count(),
    nokRepo.count(),
    historyRepo.count(),
    allergyRepo.count(),
    medAidRepo.count(),
  ]);

  console.log(`\nSeed complete:`);
  console.log(`  Patients:        ${total}`);
  console.log(`  Next of Kin:     ${nokTotal}`);
  console.log(`  Medical History: ${histTotal}`);
  console.log(`  Allergies:       ${allergyTotal}`);
  console.log(`  Medical Aid:     ${aidTotal}`);
}

// ─── Standalone runner ─────────────────────────────────────────────

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.PATIENT_DB_HOST || 'localhost',
    port: parseInt(process.env.PATIENT_DB_PORT || '5437', 10),
    username: process.env.PATIENT_DB_USER || 'clinical_user',
    password: process.env.PATIENT_DB_PASSWORD || 'clinical_password',
    database: process.env.PATIENT_DB_NAME || 'patient_db',
    entities: [
      PatientEntity,
      PatientNextOfKinEntity,
      PatientMedicalHistoryEntity,
      PatientAllergyEntity,
      PatientMedicalAidEntity,
    ],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Connected to patient database.');

  try {
    await seedPatients(dataSource);
  } finally {
    await dataSource.destroy();
    console.log('Connection closed.');
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
