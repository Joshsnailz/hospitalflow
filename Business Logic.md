Overview

Create a Patient Service (Port 3005) for Clinical Portal 2.0 following established patterns from existing services. The service will manage patient demographics, next of kin, medical
history, allergies, and medical aid records with CHI Number validation.

CHI Number Format

Format: NPPPPPPPLPP (11 characters)

- N = 1-9 (cannot start with 0)
- P = 0-9 (any digit)
- L = A-Z excluding O, U, V
- Regex: ^[1-9]\d{7}[A-NP-TV-Z]\d{2}$
- Valid example: 70282487G70

Directory Structure

apps/patient-service/
├── .env
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── src/
├── main.ts
├── app.module.ts
├── config/
│ └── roles.config.ts
├── auth/
│ ├── auth.module.ts
│ ├── decorators/
│ │ ├── current-user.decorator.ts
│ │ ├── roles.decorator.ts
│ │ └── public.decorator.ts
│ ├── guards/
│ │ ├── jwt-auth.guard.ts
│ │ └── roles.guard.ts
│ └── strategies/
│ └── jwt.strategy.ts
├── health/
│ ├── health.module.ts
│ └── health.controller.ts
├── common/
│ ├── utils/
│ │ └── chi-validator.util.ts
│ ├── validators/
│ │ └── chi-number.validator.ts
│ └── pipes/
│ └── parse-chi.pipe.ts
└── patients/
├── patients.module.ts
├── patients.controller.ts
├── patients.service.ts
├── entities/
│ ├── index.ts
│ ├── patient.entity.ts
│ ├── patient-next-of-kin.entity.ts
│ ├── patient-medical-history.entity.ts
│ ├── patient-allergy.entity.ts
│ └── patient-medical-aid.entity.ts
└── dto/
├── index.ts
├── create-patient.dto.ts
├── update-patient.dto.ts
├── patient-filter.dto.ts
├── create-next-of-kin.dto.ts
├── update-next-of-kin.dto.ts
├── create-medical-history.dto.ts
├── update-medical-history.dto.ts
├── create-allergy.dto.ts
├── update-allergy.dto.ts
├── create-medical-aid.dto.ts
└── update-medical-aid.dto.ts

Database Schema

Tables to create in patient_db:

1.  patients - Core patient record with CHI number, demographics, contact info, GP details
2.  patient_next_of_kin - Emergency contacts (FK to patients)
3.  patient_medical_history - Medical conditions, surgeries, family history (FK to patients)
4.  patient_allergies - Allergies with severity levels (FK to patients)
5.  patient_medical_aid - Insurance/medical aid info (FK to patients)

API Endpoints
┌────────┬───────────────────────────────────┬───────────────────────────────────────┐
│ Method │ Endpoint │ Description │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ POST │ /patients │ Create patient │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /patients │ List patients with pagination/filters │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /patients/validate-chi/:chi │ Validate CHI format │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /patients/chi/:chi │ Get patient by CHI number │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /patients/:id │ Get patient by ID (with relations) │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ PATCH │ /patients/:id │ Update patient │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ POST │ /patients/:id/deactivate │ Soft delete patient │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ POST │ /patients/:id/reactivate │ Reactivate patient │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ POST │ /patients/:id/next-of-kin │ Add next of kin │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /patients/:id/next-of-kin │ List next of kin │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ PATCH │ /patients/:id/next-of-kin/:nokId │ Update next of kin │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ DELETE │ /patients/:id/next-of-kin/:nokId │ Soft delete next of kin │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ POST │ /patients/:id/allergies │ Add allergy │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /patients/:id/allergies │ List allergies │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ PATCH │ /patients/:id/allergies/:id │ Update allergy │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ DELETE │ /patients/:id/allergies/:id │ Soft delete allergy │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ POST │ /patients/:id/medical-history │ Add medical history │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /patients/:id/medical-history │ List medical history │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ PATCH │ /patients/:id/medical-history/:id │ Update medical history │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ DELETE │ /patients/:id/medical-history/:id │ Soft delete medical history │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ POST │ /patients/:id/medical-aid │ Add medical aid │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /patients/:id/medical-aid │ List medical aid │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ PATCH │ /patients/:id/medical-aid/:id │ Update medical aid │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ DELETE │ /patients/:id/medical-aid/:id │ Soft delete medical aid │
├────────┼───────────────────────────────────┼───────────────────────────────────────┤
│ GET │ /healthcheck │ Health check │
└────────┴───────────────────────────────────┴───────────────────────────────────────┘
Implementation Steps

Step 1: Project Setup

- Create apps/patient-service/ directory
- Create package.json with NestJS dependencies (copy from user-service)
- Create tsconfig.json, nest-cli.json (copy from user-service)
- Create .env and .env.example with patient-service config
- Run npm install

Step 2: Copy Shared Infrastructure

- Copy src/config/roles.config.ts from user-service
- Copy src/auth/ folder (module, guards, strategies, decorators) from user-service
- Copy src/health/ folder from user-service
- Update imports to match patient-service structure

Step 3: Create Common Utilities

- Create src/common/utils/chi-validator.util.ts - CHI validation functions
- Create src/common/validators/chi-number.validator.ts - Custom decorator
- Create src/common/pipes/parse-chi.pipe.ts - Route param pipe

Step 4: Create Entities

- Create src/patients/entities/patient.entity.ts - Main patient entity
- Create src/patients/entities/patient-next-of-kin.entity.ts
- Create src/patients/entities/patient-medical-history.entity.ts
- Create src/patients/entities/patient-allergy.entity.ts
- Create src/patients/entities/patient-medical-aid.entity.ts
- Create src/patients/entities/index.ts - Exports

Step 5: Create DTOs

- Create all Create DTOs with class-validator decorators
- Create Update DTOs (PartialType of Create)
- Create PatientFilterDto for search/pagination
- Create src/patients/dto/index.ts - Exports

Step 6: Create Service Layer

- Create src/patients/patients.service.ts with:
  - Patient CRUD with CHI validation
  - Nested resource CRUD (next-of-kin, allergies, etc.)
  - Search with QueryBuilder and ILIKE
  - Soft delete pattern

Step 7: Create Controller

- Create src/patients/patients.controller.ts with:
  - All REST endpoints
  - Swagger decorations
  - Role-based guards (@Roles decorator)
  - Consistent response format

Step 8: Wire Up Modules

- Create src/patients/patients.module.ts
- Create src/app.module.ts with TypeORM config
- Create src/main.ts with bootstrap

Step 9: API Gateway Integration

- Create apps/api-gateway/src/patients/ folder
- Create patients.module.ts, patients.service.ts, patients.controller.ts
- Add PATIENT_SERVICE_URL=http://localhost:3005 to gateway .env
- Import PatientsModule in gateway app.module.ts

Step 10: Database Setup

- Create patient_db database: psql -U postgres -c "CREATE DATABASE patient_db;"

Key Files to Reference (Templates)
┌──────────────────┬─────────────────────────────────────────────────────┐
│ Pattern │ Source File │
├──────────────────┼─────────────────────────────────────────────────────┤
│ Entity structure │ apps/user-service/src/users/entities/user.entity.ts │
├──────────────────┼─────────────────────────────────────────────────────┤
│ Service layer │ apps/user-service/src/users/users.service.ts │
├──────────────────┼─────────────────────────────────────────────────────┤
│ Controller │ apps/user-service/src/users/users.controller.ts │
├──────────────────┼─────────────────────────────────────────────────────┤
│ DTOs │ apps/user-service/src/users/dto/ │
├──────────────────┼─────────────────────────────────────────────────────┤
│ Gateway proxy │ apps/api-gateway/src/users/users.service.ts │
├──────────────────┼─────────────────────────────────────────────────────┤
│ Auth guards │ apps/user-service/src/auth/guards/ │
└──────────────────┴─────────────────────────────────────────────────────┘
Environment Variables

Patient Service (.env):
NODE_ENV=development
PORT=3005
PATIENT_DB_HOST=localhost
PATIENT_DB_PORT=5432
PATIENT_DB_USER=postgres
PATIENT_DB_PASSWORD=
PATIENT_DB_NAME=patient_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
CORS_ORIGIN=http://localhost:3100

API Gateway addition (.env):
PATIENT_SERVICE_URL=http://localhost:3005

Verification Steps

1.  Database: psql -U postgres -d patient_db -c "\dt" - Should show all 5 tables
2.  Service Health: curl http://localhost:3005/healthcheck - Should return healthy
3.  Gateway Health: curl http://localhost:3000/healthcheck - Should return healthy
4.  CHI Validation: curl http://localhost:3000/patients/validate-chi/70282487G70 - Should return valid
5.  Create Patient: POST to /patients with valid CHI and demographics
6.  Get Patient: GET /patients/chi/70282487G70 - Should return created patient
7.  Swagger Docs: http://localhost:3005/api/docs - Should show all endpoints
