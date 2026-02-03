# Clinical Portal 2.0 - Implementation Plan

## Project Overview

A comprehensive, HIPAA/GDPR-compliant clinical portal covering the entire patient journey from registration to discharge. The initial skeleton focuses on authentication, RBAC, and modern UI foundation.

## Technical Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS microservices, PostgreSQL, Redis, RabbitMQ
- **Infrastructure:** Local PostgreSQL, Redis, RabbitMQ, Prometheus/Grafana
- **Monorepo:** Turborepo

## User Roles (from permissions.xlsx)

1. Consultant
2. Doctor/Physician
3. Hospital Pharmacist
4. Pharmacy Technician
5. Pharmacy Support Worker
6. Pharmacy Support Worker Manager
7. Clinical Admin/Receptionist
8. Prescriber
9. Nurse (future)
10. Patient (future)
11. Super Admin

## Architecture

### Microservices

1. **API Gateway** (Port 3000)
   - Single entry point for all client requests
   - JWT validation, routing, rate limiting
   - Aggregated Swagger documentation

2. **Auth Service** (Port 3001)
   - User authentication (login/logout)
   - JWT token generation & refresh
   - Password management
   - Database: `auth_db`

3. **User Service** (Port 3002)
   - User CRUD operations
   - Profile management
   - Role assignment
   - Database: `user_db`

4. **RBAC Service** (Port 3003)
   - Role and permission management
   - Permission checking with Redis caching
   - Resource-action authorization
   - Database: `rbac_db`

5. **Audit Service** (Port 3004)
   - HIPAA-compliant audit logging
   - PHI access tracking
   - RabbitMQ consumer for async logging
   - Database: `audit_db`

6. **Patient Service** (Port 3005)
   - Patient registration with CHI Number validation
   - Patient demographics, contacts, medical history
   - Allergies and medical aid management
   - Patient search functionality
   - Database: `patient_db`

7. **Clinical Service** (Port 3006)
   - Patient encounters (outpatient, inpatient, emergency)
   - Admissions management
   - Discharge workflow (staged: clinical → pharmacy → approval)
   - Clinical notes documentation
   - Database: `clinical_db`

8. **Hospital Management Service** (Port 3007)
   - Multi-facility management (centrally managed)
   - Departments, wards, and beds
   - Bed assignments and availability
   - Patient transfers (internal and external)
   - Database: `hospital_db`

### Database Strategy

- **Database-per-service** for autonomy and scaling
- **PostgreSQL 16** for all services
- **Redis** for caching, token blacklist, rate limiting
- **RabbitMQ** for async event processing

### Authentication Flow

1. User submits credentials → Auth Service
2. Service validates and generates JWT access token (15 min) + refresh token (7 days)
3. Access token stored in memory, refresh token in httpOnly cookie
4. API Gateway validates JWT on each request
5. Automatic token refresh on 401 response

### Authorization (RBAC)

- **Permission Format:** `resource:action:scope` (e.g., `patient:read:all`)
- **Permission Sources:**
  1. JWT token claims (fastest)
  2. Redis cache (1 hour TTL)
  3. RBAC Service database (cache miss)
- **Enforcement:** Guards/decorators at service and frontend level

## Project Structure

```
clinical-portal/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api-gateway/            # API Gateway
│   ├── auth-service/           # Authentication
│   ├── user-service/           # User management
│   ├── rbac-service/           # RBAC
│   ├── audit-service/          # Audit logging
│   ├── patient-service/        # Patient management
│   ├── clinical-service/       # Clinical encounters & discharge
│   └── hospital-service/       # Facilities, wards, beds, transfers
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── shared-config/          # ESLint, Prettier configs
│   ├── shared-utils/           # Utility functions
│   ├── api-client/             # Frontend API client
│   └── rbac/                   # RBAC logic library
├── infrastructure/
│   ├── monitoring/             # Prometheus/Grafana configs
│   └── nginx/                  # Reverse proxy configs (production)
├── scripts/                    # Setup and utility scripts
└── turbo.json
```

## Database Schema Highlights

### Auth Database (`auth_db`)
- `users_auth` - Credentials (email, password_hash)
- `refresh_tokens` - Active refresh tokens
- `token_blacklist` - Revoked tokens
- `password_reset_tokens` - Password reset flow

### User Database (`user_db`)
- `users` - Profile information
- `user_roles` - Many-to-many user-role mapping

### RBAC Database (`rbac_db`)
- `roles` - User roles (consultant, doctor, etc.)
- `resources` - What can be accessed (patient, appointment)
- `actions` - What can be done (create, read, update, delete)
- `permissions` - Resource-action combinations
- `role_permissions` - Role-permission mapping
- `user_permissions` - Individual permission overrides

### Audit Database (`audit_db`)
- `audit_logs` - All system actions (immutable)
- `data_access_logs` - PHI access tracking (HIPAA)

### Patient Database (`patient_db`)
- `patients` - Core patient record (chiNumber, demographics)
- `patient_next_of_kin` - Emergency contacts and next of kin
- `patient_medical_history` - Known conditions, past surgeries
- `patient_allergies` - Allergies and sensitivities
- `patient_medical_aid` - Medical aid/insurance details (Zimbabwean context)

### Clinical Database (`clinical_db`)
- `encounters` - All patient interactions (outpatient, inpatient, emergency)
- `admissions` - Inpatient admissions linked to encounters
- `discharge_forms` - Staged discharge workflow
- `clinical_notes` - Doctor/nurse notes (immutable for legal)

### Hospital Database (`hospital_db`)
- `facilities` - Multiple hospitals/clinics (centrally managed)
- `departments` - Hospital departments per facility
- `wards` - Ward definitions with capacity
- `beds` - Individual bed records and status
- `bed_assignments` - Patient-to-bed assignments (current and historical)
- `transfers` - Internal and external patient transfers

## Frontend Architecture

### Page Structure (App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx          # Login page
│   ├── forgot-password/page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── dashboard/page.tsx      # Main dashboard
│   ├── users/page.tsx          # User management
│   ├── roles/page.tsx          # Role management
│   ├── settings/page.tsx
│   └── layout.tsx              # Protected layout with nav
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout
└── middleware.ts               # Auth protection
```

### Key Components

- **Landing Page:** Hero section, features showcase, modern healthcare design
- **Login Form:** Email/password with Zod validation
- **Dashboard Layout:** Header, sidebar, navigation, user menu
- **DataTable:** Reusable table with sorting, filtering, pagination
- **PermissionGate:** Component-level permission enforcement
- **shadcn/ui components:** Button, Input, Dialog, Table, Badge, etc.

### State Management

- **Auth Context:** Global auth state (user, roles, permissions)
- **SWR:** Data fetching with caching and revalidation
- **React Context:** Theme, user preferences

### API Client

- Axios instance with interceptors
- Automatic token refresh on 401
- Request/response logging
- Error handling

## Security & Compliance

### HIPAA Compliance

- ✅ Unique user identification
- ✅ Automatic session timeout (15 min)
- ✅ Audit trail for all PHI access
- ✅ Encryption at rest and in transit
- ✅ Access controls and authentication
- ✅ Emergency access procedures

### GDPR Compliance

- ✅ Right to access (data export API)
- ✅ Right to erasure (data deletion API)
- ✅ Consent management
- ✅ Data minimization
- ✅ Privacy by design

### Security Measures

- **Passwords:** bcrypt with cost factor 12
- **JWT:** RS256 signing, short-lived access tokens
- **TLS:** 1.3 for all communications
- **Input Validation:** class-validator (backend), Zod (frontend)
- **SQL Injection:** ORM with parameterized queries
- **XSS:** Content Security Policy, React auto-escaping
- **CSRF:** SameSite cookies, CSRF tokens
- **Rate Limiting:** Redis-based, per-user and per-IP

## Infrastructure

### Local Development Setup

#### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 16 (running on localhost:5432)
- Redis (running on localhost:6379)
- RabbitMQ (running on localhost:5672)

#### Database Setup
Create all databases in PostgreSQL:
```sql
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE rbac_db;
CREATE DATABASE audit_db;
CREATE DATABASE patient_db;
CREATE DATABASE clinical_db;
CREATE DATABASE hospital_db;

-- Create user if not exists
CREATE USER clinical_user WITH PASSWORD 'clinical_password';
GRANT ALL PRIVILEGES ON DATABASE auth_db TO clinical_user;
GRANT ALL PRIVILEGES ON DATABASE user_db TO clinical_user;
GRANT ALL PRIVILEGES ON DATABASE rbac_db TO clinical_user;
GRANT ALL PRIVILEGES ON DATABASE audit_db TO clinical_user;
GRANT ALL PRIVILEGES ON DATABASE patient_db TO clinical_user;
GRANT ALL PRIVILEGES ON DATABASE clinical_db TO clinical_user;
GRANT ALL PRIVILEGES ON DATABASE hospital_db TO clinical_user;
```

#### Running Services Locally
```bash
# Install dependencies (from root)
npm install

# Start individual services (each in separate terminal)
cd apps/auth-service && npm run start:dev
cd apps/user-service && npm run start:dev
cd apps/rbac-service && npm run start:dev
cd apps/audit-service && npm run start:dev
cd apps/patient-service && npm run start:dev
cd apps/clinical-service && npm run start:dev
cd apps/hospital-service && npm run start:dev
cd apps/api-gateway && npm run start:dev

# Start frontend
cd apps/web && npm run dev
```

#### Service Ports
| Service | Port | Database |
|---------|------|----------|
| API Gateway | 3000 | - |
| Auth Service | 3001 | auth_db |
| User Service | 3002 | user_db |
| RBAC Service | 3003 | rbac_db |
| Audit Service | 3004 | audit_db |
| Patient Service | 3005 | patient_db |
| Clinical Service | 3006 | clinical_db |
| Hospital Service | 3007 | hospital_db |
| Web Frontend | 3100 | - |

#### Infrastructure Ports
| Service | Port |
|---------|------|
| PostgreSQL | 5432 |
| Redis | 6379 |
| RabbitMQ | 5672 |
| RabbitMQ Management | 15672 |

### Environment Variables

```bash
# Database
DB_USER=clinical_user
DB_PASSWORD=secure_password

# Redis & RabbitMQ
REDIS_PASSWORD=redis_password
RABBITMQ_USER=clinical_user
RABBITMQ_PASSWORD=rabbitmq_password

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Security
ENCRYPTION_KEY=32-byte-encryption-key
BCRYPT_ROUNDS=12
```

## Implementation Sequence

### Phase 0: Project Setup (Day 1-2)

**Goal:** Initialize monorepo and infrastructure

✅ **Tasks:**
1. Initialize Turborepo with root package.json
2. Create folder structure (apps/, packages/, infrastructure/)
3. Set up shared packages (shared-types, shared-config, shared-utils)
4. Configure TypeScript, ESLint, Prettier
5. Create .env.example with all required variables
7. Set up GitHub repository and initial commit

**Critical Files:**
- `turbo.json` - Monorepo build pipeline
- `package.json` - Root dependencies and scripts
- `.env.example` - Environment template

### Phase 1: Backend Services (Day 3-5)

**Goal:** Implement all microservices with database schemas

#### 1.1 Auth Service

✅ **Tasks:**
1. Initialize NestJS project in `apps/auth-service/`
2. Set up TypeORM with auth_db connection
3. Create database migrations:
   - users_auth table
   - refresh_tokens table
   - token_blacklist table
   - password_reset_tokens table
4. Implement AuthController and AuthService:
   - POST /auth/login
   - POST /auth/logout
   - POST /auth/refresh
   - POST /auth/register
5. Implement JWT strategies (access + refresh)
6. Implement bcrypt password hashing
7. Add Redis integration for token blacklist
8. Add Swagger documentation
9. Write unit tests for auth logic

**Critical Files:**
- `apps/auth-service/src/auth/auth.service.ts`
- `apps/auth-service/src/database/migrations/001_initial.ts`
- `apps/auth-service/src/auth/strategies/jwt.strategy.ts`

#### 1.2 User Service

✅ **Tasks:**
1. Initialize NestJS project in `apps/user-service/`
2. Set up TypeORM with user_db connection
3. Create database migrations:
   - users table
   - user_roles table
4. Implement UsersController and UsersService:
   - GET /users (with pagination, filtering)
   - GET /users/:id
   - POST /users
   - PATCH /users/:id
   - DELETE /users/:id
   - POST /users/:id/roles (assign role)
   - DELETE /users/:id/roles/:roleId (remove role)
5. Add Swagger documentation
6. Write unit tests

**Critical Files:**
- `apps/user-service/src/users/users.service.ts`
- `apps/user-service/src/database/migrations/001_initial.ts`
- `apps/user-service/src/users/dto/create-user.dto.ts`

#### 1.3 RBAC Service

✅ **Tasks:**
1. Initialize NestJS project in `apps/rbac-service/`
2. Set up TypeORM with rbac_db connection
3. Create database migrations:
   - roles table
   - resources table
   - actions table
   - permissions table
   - role_permissions table
   - user_permissions table
4. Create seed script with initial roles from permissions.xlsx:
   - Consultant, Doctor, Pharmacist, Technician, etc.
5. Implement RolesController and PermissionsController:
   - GET /roles
   - POST /roles
   - PATCH /roles/:id
   - GET /permissions
   - POST /permissions
   - POST /roles/:id/permissions (assign permissions)
   - GET /users/:id/permissions (get user permissions)
   - POST /check-permission (permission check endpoint)
6. Add Redis integration for permission caching
7. Add Swagger documentation
8. Write unit tests

**Critical Files:**
- `apps/rbac-service/src/database/migrations/001_initial.ts`
- `apps/rbac-service/src/database/seeds/initial-roles.seed.ts`
- `apps/rbac-service/src/permissions/permissions.service.ts`
- `apps/rbac-service/src/redis/permission-cache.service.ts`

#### 1.4 Audit Service

✅ **Tasks:**
1. Initialize NestJS project in `apps/audit-service/`
2. Set up TypeORM with audit_db connection
3. Create database migrations:
   - audit_logs table (with indexes)
   - data_access_logs table
4. Implement AuditController and AuditService:
   - POST /audit/logs (create log)
   - GET /audit/logs (query logs)
   - GET /audit/data-access (PHI access logs)
5. Set up RabbitMQ consumer for async log ingestion
6. Add Swagger documentation
7. Write unit tests

**Critical Files:**
- `apps/audit-service/src/database/migrations/001_initial.ts`
- `apps/audit-service/src/audit/audit.service.ts`
- `apps/audit-service/src/rabbitmq/audit-consumer.service.ts`

### Phase 2: API Gateway (Day 6-7)

**Goal:** Create unified API entry point

✅ **Tasks:**
1. Initialize NestJS project in `apps/api-gateway/`
2. Create route configuration mapping to services
3. Implement JWT validation middleware
4. Implement permission checking guard
5. Implement rate limiting (Redis-based)
6. Add request logging with request ID
7. Add CORS configuration
8. Aggregate Swagger from all services
9. Add error handling and transformation
10. Add health check endpoints
11. Write integration tests

**Critical Files:**
- `apps/api-gateway/src/config/routes.config.ts`
- `apps/api-gateway/src/middleware/auth.middleware.ts`
- `apps/api-gateway/src/guards/permission.guard.ts`
- `apps/api-gateway/src/swagger/swagger.config.ts`

### Phase 3: Frontend Foundation (Day 8-10)

**Goal:** Build authentication UI and dashboard shell

#### 3.1 Project Setup

✅ **Tasks:**
1. Initialize Next.js 14 in `apps/web/`
2. Configure Tailwind CSS
3. Install and configure shadcn/ui components:
   - button, input, form, dialog, table, badge, dropdown-menu
4. Set up folder structure (app/, components/, lib/, types/)
5. Configure environment variables

#### 3.2 Landing Page

✅ **Tasks:**
1. Create `app/page.tsx` with:
   - Hero section with professional healthcare imagery
   - Features showcase (Security, Compliance, Efficiency)
   - Call-to-action buttons (Login, Learn More)
   - Modern, accessible design
2. Add responsive layout
3. Add smooth scroll and animations

**Critical Files:**
- `apps/web/src/app/page.tsx`

#### 3.3 Authentication

✅ **Tasks:**
1. Create auth context in `lib/auth/AuthProvider.tsx`
2. Create token manager in `lib/auth/tokenManager.ts`
3. Create API client in `lib/api/client.ts` with:
   - Axios interceptors for token refresh
   - Error handling
   - Request/response logging
4. Create auth API functions in `lib/api/auth.ts`
5. Create login page in `app/(auth)/login/page.tsx`:
   - Email/password form
   - Zod validation
   - Error messages
   - Loading states
6. Create auth layout with branding
7. Implement Next.js middleware for route protection
8. Add useAuth and usePermission hooks

**Critical Files:**
- `apps/web/src/lib/auth/AuthProvider.tsx`
- `apps/web/src/lib/api/client.ts`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/middleware.ts`

#### 3.4 Dashboard Shell

✅ **Tasks:**
1. Create protected dashboard layout in `app/(dashboard)/layout.tsx`:
   - Header with logo, user menu, logout
   - Sidebar navigation with icons
   - Breadcrumbs
   - Footer
2. Create dashboard home page in `app/(dashboard)/dashboard/page.tsx`:
   - Welcome message
   - Quick stats cards
   - Recent activity
3. Make layout responsive (mobile-friendly)

**Critical Files:**
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/Sidebar.tsx`

#### 3.5 User Management UI

✅ **Tasks:**
1. Create user list page in `app/(dashboard)/users/page.tsx`:
   - DataTable with users
   - Search and filter
   - Pagination
   - Actions (view, edit, delete)
2. Create user creation/edit form:
   - Form validation with Zod
   - Role assignment dropdown
   - Error handling
3. Add permission gates (only admins can create/delete users)

**Critical Files:**
- `apps/web/src/app/(dashboard)/users/page.tsx`
- `apps/web/src/components/common/DataTable.tsx`
- `apps/web/src/components/forms/UserForm.tsx`

#### 3.6 Role Management UI

✅ **Tasks:**
1. Create role list page in `app/(dashboard)/roles/page.tsx`
2. Create role form for creating/editing roles
3. Add permission assignment interface
4. Add permission gates (only super admin can manage roles)

**Critical Files:**
- `apps/web/src/app/(dashboard)/roles/page.tsx`
- `apps/web/src/components/forms/RoleForm.tsx`

### Phase 4: Integration & Testing (Day 11-12)

**Goal:** Connect everything and ensure it works end-to-end

✅ **Tasks:**
1. Ensure PostgreSQL, Redis, and RabbitMQ are running locally
2. Create all databases in PostgreSQL
3. Run database migrations for all services
3. Seed initial data (roles, permissions, test users)
4. Test complete authentication flow:
   - User registration
   - Login with valid credentials
   - Login with invalid credentials
   - Token refresh
   - Logout
5. Test user management flow:
   - Create user
   - Assign roles
   - Update user
   - View user list
   - Delete user
6. Test role management flow:
   - Create role
   - Assign permissions
   - View permissions
7. Test permission enforcement:
   - Try to access protected routes without login
   - Try to perform actions without permission
   - Verify permission gates work
8. Test audit logging:
   - Verify all actions are logged
   - Query audit logs
9. Run unit tests for all services
10. Run integration tests
11. Run E2E tests with Playwright

### Phase 5: Monitoring & Documentation (Day 13-14)

**Goal:** Set up observability and documentation

✅ **Tasks:**
1. Configure Prometheus to scrape all services
2. Create Grafana dashboards:
   - System overview (CPU, memory, disk)
   - API performance (request rates, latencies)
   - Database performance
   - Authentication metrics
3. Add custom metrics to services:
   - Login success/failure rates
   - Token refresh rates
   - Permission check times
4. Write comprehensive README.md:
   - Project overview
   - Setup instructions
   - Running locally
   - Environment variables
   - API documentation links
5. Write ARCHITECTURE.md with system design
6. Write SECURITY.md with compliance notes
7. Create API documentation using Swagger UI
8. Write deployment guide

**Critical Files:**
- `infrastructure/monitoring/prometheus.yml`
- `infrastructure/monitoring/grafana/dashboards/`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`

## Code Quality Standards

### TypeScript

- Strict mode enabled
- No `any` types
- Explicit return types for functions
- Proper error types

### Testing

- **Unit Tests:** 80% coverage target
- **Integration Tests:** All API endpoints
- **E2E Tests:** Critical user flows
- Jest for backend, Playwright for frontend

### Linting

- ESLint with TypeScript rules
- Prettier for formatting
- Husky pre-commit hooks
- No console.log in production code

### Git Workflow

- Feature branches from `develop`
- Branch naming: `feature/CP-123-description`
- Commit format: `feat(scope): description`
- PR requires 1 approval
- Squash and merge

## Verification & Testing

### Manual Testing Checklist

1. **Authentication:**
   - [ ] Can register new user
   - [ ] Can login with valid credentials
   - [ ] Cannot login with invalid credentials
   - [ ] Access token expires after 15 minutes
   - [ ] Refresh token rotates on use
   - [ ] Can logout successfully
   - [ ] Logged out users redirected to login

2. **Authorization:**
   - [ ] Super admin can access all features
   - [ ] Doctor can view but not create users
   - [ ] Clinical admin can manage users
   - [ ] Unauthorized actions return 403
   - [ ] Protected routes require authentication

3. **User Management:**
   - [ ] Can create new user
   - [ ] Can assign roles to user
   - [ ] Can update user profile
   - [ ] Can deactivate user
   - [ ] Can search and filter users
   - [ ] Pagination works correctly

4. **Role Management:**
   - [ ] Can view all roles
   - [ ] Can create new role
   - [ ] Can assign permissions to role
   - [ ] Can update role
   - [ ] Cannot delete system roles

5. **Audit Logging:**
   - [ ] All logins are logged
   - [ ] All user actions are logged
   - [ ] Can query audit logs
   - [ ] Audit logs are immutable
   - [ ] Timestamps are accurate

6. **UI/UX:**
   - [ ] Landing page is visually appealing
   - [ ] Login page is professional
   - [ ] Dashboard layout is intuitive
   - [ ] Navigation works smoothly
   - [ ] Forms validate inputs
   - [ ] Error messages are clear
   - [ ] Loading states are shown
   - [ ] Responsive on mobile devices

### Automated Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific service tests
npm run test --filter=auth-service
```

### API Testing

Access Swagger UI at:
- **API Gateway:** http://localhost:3000/api/docs
- **Auth Service:** http://localhost:3001/api/docs
- **User Service:** http://localhost:3002/api/docs
- **RBAC Service:** http://localhost:3003/api/docs
- **Audit Service:** http://localhost:3004/api/docs
- **Patient Service:** http://localhost:3005/api/docs
- **Clinical Service:** http://localhost:3006/api/docs
- **Hospital Service:** http://localhost:3007/api/docs

### Monitoring

Access monitoring tools at:
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3200 (admin/admin)
- **RabbitMQ Management:** http://localhost:15672

### Health Checks

Check service health:
```bash
# All services
curl http://localhost:3000/health

# Individual services
curl http://localhost:3001/healthcheck  # Auth
curl http://localhost:3002/healthcheck  # User
curl http://localhost:3003/healthcheck  # RBAC
curl http://localhost:3004/healthcheck  # Audit
curl http://localhost:3005/healthcheck  # Patient
curl http://localhost:3006/healthcheck  # Clinical
curl http://localhost:3007/healthcheck  # Hospital
```

## Security Checklist

Before deploying:

- [ ] All environment variables properly configured
- [ ] JWT secrets are strong (32+ characters)
- [ ] Database passwords are strong
- [ ] No hardcoded secrets in code
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection via ORM
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Audit logging working
- [ ] Password policy enforced
- [ ] Session timeout configured (15 min)

## Phase 6: Patient Service (Port 3005)

**Goal:** Central patient registry with CHI Number validation

### CHI Number Format
```
Format: NPPPPPPPLPP
- N = 1-9 (cannot start with 0)
- P = 0-9 (any digit)
- L = A-Z excluding O, U, V

Valid:   70282487G70
Invalid: 01232323V70 (starts with 0, contains V)
```

### 6.1 Patient Service Setup

**Tasks:**
1. Initialize NestJS project in `apps/patient-service/`
2. Set up TypeORM with patient_db connection
3. Create database migrations for all entities
4. Configure RabbitMQ for event publishing
5. Configure Redis for caching

### 6.2 Patient Entities

**patients table:**
```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chi_number VARCHAR(11) UNIQUE NOT NULL,  -- Format: NPPPPPPPLPP

    -- Demographics
    title VARCHAR(10),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    national_id VARCHAR(50),
    passport_number VARCHAR(50),

    -- Contact
    email VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),

    -- Address
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Zimbabwe',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_deceased BOOLEAN DEFAULT false,
    deceased_date DATE,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);
```

**patient_next_of_kin table:**
```sql
CREATE TABLE patient_next_of_kin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    relationship VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    address VARCHAR(500),
    is_primary BOOLEAN DEFAULT false,
    is_emergency_contact BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**patient_medical_history table:**
```sql
CREATE TABLE patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    condition_type VARCHAR(50) NOT NULL,      -- chronic, past_surgery, family_history
    condition_name VARCHAR(255) NOT NULL,
    description TEXT,
    diagnosed_date DATE,
    is_current BOOLEAN DEFAULT true,
    severity VARCHAR(20),                     -- mild, moderate, severe
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    recorded_by UUID
);
```

**patient_allergies table:**
```sql
CREATE TABLE patient_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    allergy_type VARCHAR(50) NOT NULL,        -- drug, food, environmental, other
    allergen VARCHAR(255) NOT NULL,
    reaction VARCHAR(500),
    severity VARCHAR(20) NOT NULL,            -- mild, moderate, severe, life_threatening
    is_confirmed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    recorded_by UUID
);
```

**patient_medical_aid table:**
```sql
CREATE TABLE patient_medical_aid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_name VARCHAR(255) NOT NULL,      -- CIMAS, PSMAS, First Mutual, etc.
    scheme_name VARCHAR(255),
    member_number VARCHAR(100) NOT NULL,
    principal_member_name VARCHAR(255),
    relationship_to_principal VARCHAR(50),    -- Self, Spouse, Child
    coverage_type VARCHAR(50),                -- Individual, Family, Corporate
    effective_date DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    provider_phone VARCHAR(20),
    provider_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6.3 Patient API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/patients` | Register new patient |
| GET | `/patients` | Search patients (query params) |
| GET | `/patients/:id` | Get patient by internal ID |
| GET | `/patients/chi/:chiNumber` | Get patient by CHI Number |
| PATCH | `/patients/:id` | Update patient demographics |
| DELETE | `/patients/:id` | Soft delete (deactivate) patient |
| GET | `/patients/:id/next-of-kin` | Get patient's contacts |
| POST | `/patients/:id/next-of-kin` | Add next of kin |
| PATCH | `/patients/:id/next-of-kin/:nokId` | Update contact |
| DELETE | `/patients/:id/next-of-kin/:nokId` | Remove contact |
| GET | `/patients/:id/medical-history` | Get medical history |
| POST | `/patients/:id/medical-history` | Add medical condition |
| PATCH | `/patients/:id/medical-history/:historyId` | Update condition |
| GET | `/patients/:id/allergies` | Get allergies |
| POST | `/patients/:id/allergies` | Add allergy |
| PATCH | `/patients/:id/allergies/:allergyId` | Update allergy |
| DELETE | `/patients/:id/allergies/:allergyId` | Remove allergy |
| GET | `/patients/:id/medical-aid` | Get medical aid details |
| POST | `/patients/:id/medical-aid` | Add medical aid |
| PATCH | `/patients/:id/medical-aid/:aidId` | Update medical aid |
| DELETE | `/patients/:id/medical-aid/:aidId` | Remove medical aid |
| GET | `/patients/validate-chi/:chiNumber` | Validate CHI Number format |

### 6.4 CHI Number Validation

```typescript
/**
 * CHI Number Format: NPPPPPPPLPP
 * Regex: ^[1-9]\d{7}[A-NP-TV-Z]\d{2}$
 */
function validateChiNumber(chi: string): boolean {
  if (!chi || chi.length !== 11) return false;
  const pattern = /^[1-9]\d{7}[A-NP-TV-Z]\d{2}$/;
  return pattern.test(chi.toUpperCase());
}
```

### 6.5 Patient Service Structure

```
apps/patient-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── roles.config.ts
│   ├── database/
│   │   ├── data-source.ts
│   │   └── migrations/
│   ├── auth/                          # JWT validation
│   ├── health/
│   ├── patients/
│   │   ├── patients.module.ts
│   │   ├── patients.controller.ts
│   │   ├── patients.service.ts
│   │   ├── entities/
│   │   │   ├── patient.entity.ts
│   │   │   ├── patient-next-of-kin.entity.ts
│   │   │   ├── patient-medical-history.entity.ts
│   │   │   ├── patient-allergy.entity.ts
│   │   │   └── patient-medical-aid.entity.ts
│   │   ├── dto/
│   │   └── validators/
│   │       └── chi-number.validator.ts
│   └── rabbitmq/
│       └── patient-events.service.ts
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env
```

---

## Phase 7: Hospital Management Service (Port 3007)

**Goal:** Multi-facility management with wards, beds, and transfers

### 7.1 Hospital Service Setup

**Tasks:**
1. Initialize NestJS project in `apps/hospital-service/`
2. Set up TypeORM with hospital_db connection
3. Create database migrations
4. Configure RabbitMQ for event publishing
5. Configure Redis for caching ward availability

### 7.2 Hospital Entities

**facilities table:**
```sql
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,         -- e.g., "PGH", "MPH"
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL,       -- hospital, clinic, satellite
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Zimbabwe',
    phone_main VARCHAR(20),
    phone_emergency VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**departments table:**
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_type VARCHAR(50),              -- clinical, administrative, support
    description TEXT,
    head_of_department_id UUID,
    phone VARCHAR(20),
    email VARCHAR(255),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, code)
);
```

**wards table:**
```sql
CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    department_id UUID REFERENCES departments(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ward_type VARCHAR(50) NOT NULL,           -- general, icu, maternity, pediatric, psychiatric
    floor VARCHAR(20),
    building VARCHAR(100),
    total_beds INTEGER NOT NULL DEFAULT 0,
    nurse_station_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, code)
);
```

**beds table:**
```sql
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID NOT NULL REFERENCES wards(id),
    bed_number VARCHAR(20) NOT NULL,
    bed_type VARCHAR(50) NOT NULL,            -- standard, electric, icu, crib
    status VARCHAR(20) NOT NULL DEFAULT 'available',  -- available, occupied, maintenance, reserved
    features JSONB,                           -- { "oxygen": true, "suction": true }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ward_id, bed_number)
);
```

**bed_assignments table:**
```sql
CREATE TABLE bed_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_id UUID NOT NULL REFERENCES beds(id),
    patient_id UUID NOT NULL,
    admission_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    released_at TIMESTAMP,
    assigned_by UUID NOT NULL,
    released_by UUID,
    notes TEXT,
    is_current BOOLEAN DEFAULT true
);
```

**transfers table:**
```sql
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    admission_id UUID,
    transfer_type VARCHAR(20) NOT NULL,       -- internal, external_out, external_in

    -- Source
    source_facility_id UUID REFERENCES facilities(id),
    source_ward_id UUID REFERENCES wards(id),
    source_bed_id UUID REFERENCES beds(id),
    source_external_facility VARCHAR(255),

    -- Destination
    destination_facility_id UUID REFERENCES facilities(id),
    destination_ward_id UUID REFERENCES wards(id),
    destination_bed_id UUID REFERENCES beds(id),
    destination_external_facility VARCHAR(255),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, in_transit, completed, cancelled

    -- Timing
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP,
    departed_at TIMESTAMP,
    arrived_at TIMESTAMP,

    -- People
    requested_by UUID NOT NULL,
    approved_by UUID,

    reason TEXT,
    clinical_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7.3 Hospital API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Facilities** | | |
| GET | `/facilities` | List all facilities |
| POST | `/facilities` | Create facility |
| GET | `/facilities/:id` | Get facility details |
| PATCH | `/facilities/:id` | Update facility |
| **Departments** | | |
| GET | `/facilities/:facilityId/departments` | List departments |
| POST | `/facilities/:facilityId/departments` | Create department |
| PATCH | `/departments/:id` | Update department |
| **Wards** | | |
| GET | `/facilities/:facilityId/wards` | List wards in facility |
| POST | `/facilities/:facilityId/wards` | Create ward |
| GET | `/wards/:id` | Get ward details with bed availability |
| PATCH | `/wards/:id` | Update ward |
| GET | `/wards/:id/beds` | List beds in ward |
| **Beds** | | |
| POST | `/wards/:wardId/beds` | Create bed |
| PATCH | `/beds/:id` | Update bed |
| GET | `/beds/:id` | Get bed details |
| POST | `/beds/:id/assign` | Assign patient to bed |
| POST | `/beds/:id/release` | Release bed |
| GET | `/beds/available` | Find available beds |
| **Transfers** | | |
| POST | `/transfers` | Request transfer |
| GET | `/transfers` | List transfers |
| GET | `/transfers/:id` | Get transfer details |
| PATCH | `/transfers/:id/approve` | Approve transfer |
| PATCH | `/transfers/:id/depart` | Mark departed |
| PATCH | `/transfers/:id/arrive` | Mark arrived/complete |
| PATCH | `/transfers/:id/cancel` | Cancel transfer |

### 7.4 Hospital Service Structure

```
apps/hospital-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── database/
│   ├── auth/
│   ├── health/
│   ├── facilities/
│   │   ├── facilities.module.ts
│   │   ├── facilities.controller.ts
│   │   ├── facilities.service.ts
│   │   └── entities/
│   ├── departments/
│   ├── wards/
│   ├── beds/
│   ├── transfers/
│   └── rabbitmq/
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env
```

---

## Phase 8: Clinical Service (Port 3006)

**Goal:** Encounters, admissions, and discharge workflow management

### 8.1 Clinical Service Setup

**Tasks:**
1. Initialize NestJS project in `apps/clinical-service/`
2. Set up TypeORM with clinical_db connection
3. Create database migrations
4. Configure RabbitMQ consumer for patient/hospital events
5. Configure Redis for caching

### 8.2 Clinical Entities

**encounters table:**
```sql
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL,
    facility_id UUID NOT NULL,
    encounter_type VARCHAR(20) NOT NULL,      -- outpatient, inpatient, emergency, day_case
    encounter_status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, discharged, transferred, cancelled
    check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMP,
    chief_complaint TEXT,
    presenting_symptoms TEXT,
    triage_level VARCHAR(20),
    attending_physician_id UUID,
    department_id UUID,
    referral_source VARCHAR(100),
    referral_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL
);
```

**admissions table:**
```sql
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL,
    admission_type VARCHAR(20) NOT NULL,      -- emergency, elective, transfer
    admission_status VARCHAR(20) NOT NULL DEFAULT 'admitted',  -- admitted, discharged, transferred
    admitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    discharged_at TIMESTAMP,
    facility_id UUID NOT NULL,
    ward_id UUID,
    bed_id UUID,
    admitting_physician_id UUID NOT NULL,
    attending_physician_id UUID,
    admitting_diagnosis TEXT,
    expected_length_of_stay INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**discharge_forms table (staged workflow):**
```sql
CREATE TABLE discharge_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES admissions(id),
    patient_id UUID NOT NULL,

    -- Status: draft → clinical_review → pharmacy_review → pending_approval → approved → completed
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    -- Clinical section
    discharge_diagnosis TEXT,
    procedures_performed TEXT,
    clinical_summary TEXT,
    complications TEXT,
    follow_up_instructions TEXT,
    follow_up_date DATE,
    follow_up_department VARCHAR(100),
    clinical_reviewed_by UUID,
    clinical_reviewed_at TIMESTAMP,

    -- Pharmacy section
    discharge_medications JSONB,
    medication_instructions TEXT,
    pharmacy_reviewed_by UUID,
    pharmacy_reviewed_at TIMESTAMP,

    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP,

    -- Completion
    completed_by UUID,
    completed_at TIMESTAMP,

    -- Outcome
    discharge_disposition VARCHAR(50),        -- home, transfer, deceased, against_advice
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**clinical_notes table (immutable):**
```sql
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL,
    note_type VARCHAR(50) NOT NULL,           -- progress, consultation, nursing, procedure
    note_title VARCHAR(255),
    content TEXT NOT NULL,
    authored_by UUID NOT NULL,
    authored_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_amendment BOOLEAN DEFAULT false,
    amends_note_id UUID REFERENCES clinical_notes(id),
    created_at TIMESTAMP DEFAULT NOW()
    -- No updated_at - notes are immutable for legal reasons
);
```

### 8.3 Discharge Workflow States

```
┌─────────────────────────────────────────────┐
│                   DRAFT                      │
│   (Doctor starts filling discharge form)     │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│             CLINICAL_REVIEW                  │
│   (Appears on Clinical Discharge List)       │
│   (Doctor completes clinical section)        │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│             PHARMACY_REVIEW                  │
│   (Appears on Pharmacy Discharge List)       │
│   (Pharmacist reviews medications)           │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│            PENDING_APPROVAL                  │
│   (Senior clinician approval)                │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│               APPROVED                       │
│   (Ready for patient release)                │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              COMPLETED                       │
│   (Patient has left, bed released)           │
└─────────────────────────────────────────────┘
```

### 8.4 Clinical API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Encounters** | | |
| POST | `/encounters` | Create encounter (walk-in, appointment) |
| GET | `/encounters` | Search encounters |
| GET | `/encounters/:id` | Get encounter details |
| PATCH | `/encounters/:id` | Update encounter |
| GET | `/patients/:patientId/encounters` | Patient's encounter history |
| **Admissions** | | |
| POST | `/admissions` | Create admission from encounter |
| GET | `/admissions` | List admissions (active, by ward, etc.) |
| GET | `/admissions/:id` | Get admission details |
| PATCH | `/admissions/:id` | Update admission |
| GET | `/patients/:patientId/admissions` | Patient's admission history |
| **Discharge** | | |
| POST | `/admissions/:admissionId/discharge` | Create discharge form |
| GET | `/discharge-forms/:id` | Get discharge form |
| PATCH | `/discharge-forms/:id` | Update discharge form |
| PATCH | `/discharge-forms/:id/clinical-review` | Submit clinical review |
| PATCH | `/discharge-forms/:id/pharmacy-review` | Submit pharmacy review |
| PATCH | `/discharge-forms/:id/approve` | Approve discharge |
| PATCH | `/discharge-forms/:id/complete` | Complete discharge |
| GET | `/discharge-forms/clinical-list` | Pending clinical reviews |
| GET | `/discharge-forms/pharmacy-list` | Pending pharmacy reviews |
| **Clinical Notes** | | |
| POST | `/encounters/:encounterId/notes` | Add clinical note |
| GET | `/encounters/:encounterId/notes` | Get notes for encounter |
| POST | `/clinical-notes/:id/amend` | Amend a note |

### 8.5 Clinical Service Structure

```
apps/clinical-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── database/
│   ├── auth/
│   ├── health/
│   ├── encounters/
│   ├── admissions/
│   ├── discharge/
│   ├── clinical-notes/
│   └── rabbitmq/
│       ├── clinical-events.service.ts
│       └── clinical-consumer.service.ts
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env
```

---

## Phase 9: Event Bus & Integration

**Goal:** Connect all services with event-driven communication

### 9.1 RabbitMQ Events

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `patient.created` | Patient Service | Clinical, Hospital, Audit |
| `patient.updated` | Patient Service | Clinical, Hospital, Audit |
| `patient.accessed` | All Services | Audit (for Recent Patients) |
| `encounter.created` | Clinical Service | Hospital, Audit |
| `admission.created` | Clinical Service | Hospital, Audit |
| `discharge.completed` | Clinical Service | Hospital, Audit |
| `bed.assigned` | Hospital Service | Clinical, Audit |
| `bed.released` | Hospital Service | Clinical, Audit |
| `transfer.completed` | Hospital Service | Clinical, Audit |

### 9.2 Redis Caching

| Cache Key | Data | TTL | Purpose |
|-----------|------|-----|---------|
| `patient:{chiNumber}` | Basic patient info | 15 min | Quick lookups |
| `user:{userId}:recent_patients` | Recent 50 chiNumbers | 10 min | Recent patients list |
| `ward:{wardId}:availability` | Bed availability | 5 min | Admission screen |
| `facility:{facilityId}:wards` | Ward list | 30 min | Facility overview |

---

## Phase 10: Frontend Updates

**Goal:** Update sidebar and create patient-centric pages

### 10.1 Sidebar Menu Structure

```typescript
const menuItems = [
  {
    id: 'home',
    label: 'Home',
    icon: 'Home',
    path: '/dashboard',
  },
  {
    id: 'patient-list',
    label: 'Patient List',
    icon: 'Users',
    type: 'dropdown',
    children: [
      { id: 'recent-patients', label: 'Recent Patients', path: '/patients/recent' },
      { id: 'clinical-discharge', label: 'Clinical Discharge List', path: '/discharge/clinical' },
      { id: 'pharmacy-discharge', label: 'Pharmacy Discharge List', path: '/discharge/pharmacy' },
    ],
  },
  {
    id: 'patient-search',
    label: 'Patient Search',
    icon: 'Search',
    path: '/patients/search',
  },
  {
    id: 'clinical-apps',
    label: 'Clinical Apps',
    icon: 'Stethoscope',
    type: 'dropdown',
    children: [
      { id: 'clinical-imaging', label: 'Clinical Imaging', path: '/clinical/imaging' },
      { id: 'controlled-drugs', label: 'Controlled Drugs', path: '/clinical/controlled-drugs' },
      { id: 'emergency-care', label: 'Emergency Care Services', path: '/clinical/emergency' },
      { id: 'continued-care', label: 'Continued Care', path: '/clinical/continued-care' },
    ],
  },
  {
    id: 'business-apps',
    label: 'Business Apps',
    icon: 'Briefcase',
    type: 'section',
    children: [
      { id: 'helpdesk', label: 'Helpdesk', path: '/business/helpdesk' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'Settings',
    type: 'section',
    children: [
      { id: 'user-management', label: 'User Management', path: '/admin/users' },
      { id: 'settings', label: 'Settings', path: '/admin/settings' },
      { id: 'audit-trails', label: 'Audit Trails', path: '/admin/audit' },
    ],
  },
];
```

### 10.2 New Pages

| Page | Path | Description |
|------|------|-------------|
| Recent Patients | `/patients/recent` | User's recently accessed patients (top 50 from audit) |
| Patient Search | `/patients/search` | Search by CHI, name, DOB |
| Patient Registration | `/patients/register` | New patient form with CHI validation |
| Patient Profile | `/patients/:chiNumber` | Full patient details with tabs |
| Clinical Discharge List | `/discharge/clinical` | Pending clinical reviews |
| Pharmacy Discharge List | `/discharge/pharmacy` | Pending pharmacy reviews |
| Clinical Imaging | `/clinical/imaging` | Placeholder |
| Controlled Drugs | `/clinical/controlled-drugs` | Placeholder |
| Emergency Care | `/clinical/emergency` | Placeholder |
| Continued Care | `/clinical/continued-care` | Placeholder |
| Helpdesk | `/business/helpdesk` | Placeholder |
| Audit Trails | `/admin/audit` | View audit logs |

---

## Phase 11: API Gateway Updates

**Goal:** Add routes for new services

### 11.1 New Routes

```typescript
// Patient Service routes
'/api/patients/*' → patient-service:3005

// Clinical Service routes
'/api/encounters/*' → clinical-service:3006
'/api/admissions/*' → clinical-service:3006
'/api/discharge-forms/*' → clinical-service:3006
'/api/clinical-notes/*' → clinical-service:3006

// Hospital Management routes
'/api/facilities/*' → hospital-service:3007
'/api/departments/*' → hospital-service:3007
'/api/wards/*' → hospital-service:3007
'/api/beds/*' → hospital-service:3007
'/api/transfers/*' → hospital-service:3007
```

---

## New Environment Variables

### Patient Service (.env)
```bash
NODE_ENV=development
PORT=3005

PATIENT_DB_HOST=localhost
PATIENT_DB_PORT=5432
PATIENT_DB_USER=clinical_user
PATIENT_DB_PASSWORD=clinical_password
PATIENT_DB_NAME=patient_db

JWT_SECRET=<same-as-auth-service>

RABBITMQ_URL=amqp://clinical_user:password@localhost:5672
REDIS_URL=redis://localhost:6379

CORS_ORIGIN=http://localhost:3100
```

### Clinical Service (.env)
```bash
NODE_ENV=development
PORT=3006

CLINICAL_DB_HOST=localhost
CLINICAL_DB_PORT=5432
CLINICAL_DB_USER=clinical_user
CLINICAL_DB_PASSWORD=clinical_password
CLINICAL_DB_NAME=clinical_db

JWT_SECRET=<same-as-auth-service>

RABBITMQ_URL=amqp://clinical_user:password@localhost:5672
REDIS_URL=redis://localhost:6379

CORS_ORIGIN=http://localhost:3100
```

### Hospital Service (.env)
```bash
NODE_ENV=development
PORT=3007

HOSPITAL_DB_HOST=localhost
HOSPITAL_DB_PORT=5432
HOSPITAL_DB_USER=clinical_user
HOSPITAL_DB_PASSWORD=clinical_password
HOSPITAL_DB_NAME=hospital_db

JWT_SECRET=<same-as-auth-service>

RABBITMQ_URL=amqp://clinical_user:password@localhost:5672
REDIS_URL=redis://localhost:6379

CORS_ORIGIN=http://localhost:3100
```

---

## Implementation Order Summary

| Phase | Service/Task | Dependencies |
|-------|--------------|--------------|
| 6 | Patient Service | Phases 0-5 complete |
| 7 | Hospital Management Service | None (parallel with Phase 6) |
| 8 | Clinical Service | Phases 6 & 7 complete |
| 9 | Event Bus Integration | Phases 6-8 complete |
| 10 | Frontend Updates | Phases 6-9 complete |
| 11 | API Gateway Updates | Phases 6-8 complete |

---

## Next Steps (Future Modules)

After core clinical services are complete, implement:

1. **Appointment Scheduling**
   - Calendar management
   - Doctor availability
   - Booking system

2. **Lab Orders & Results**
   - Order tests
   - View results
   - Integration with lab systems

3. **Medication Management**
   - Prescription writing
   - Medication tracking
   - Controlled drugs register

4. **Clinical Imaging Module**
   - Imaging requests
   - Results viewing
   - PACS integration

5. **Reporting & Analytics**
   - Operational dashboards
   - HIPAA compliance reports
   - Custom report builder

## Critical Files Reference

### Infrastructure
- `turbo.json` - Monorepo configuration
- `.env.example` - Environment template

### API Gateway
- `apps/api-gateway/src/config/routes.config.ts` - Route mapping
- `apps/api-gateway/src/guards/permission.guard.ts` - Authorization

### Auth Service
- `apps/auth-service/src/auth/auth.service.ts` - Authentication logic
- `apps/auth-service/src/database/migrations/001_initial.ts` - Database schema

### RBAC Service
- `apps/rbac-service/src/database/migrations/001_initial.ts` - RBAC schema
- `apps/rbac-service/src/database/seeds/initial-roles.seed.ts` - Initial roles

### Audit Service
- `apps/audit-service/src/audit/audit.service.ts` - Audit logging logic
- `apps/audit-service/src/rabbitmq/audit-consumer.service.ts` - RabbitMQ consumer

### Patient Service
- `apps/patient-service/src/patients/patients.service.ts` - Patient management
- `apps/patient-service/src/patients/validators/chi-number.validator.ts` - CHI validation
- `apps/patient-service/src/database/migrations/001_initial.ts` - Patient schema

### Clinical Service
- `apps/clinical-service/src/encounters/encounters.service.ts` - Encounter management
- `apps/clinical-service/src/discharge/discharge.service.ts` - Discharge workflow
- `apps/clinical-service/src/database/migrations/001_initial.ts` - Clinical schema

### Hospital Service
- `apps/hospital-service/src/facilities/facilities.service.ts` - Facility management
- `apps/hospital-service/src/beds/beds.service.ts` - Bed management
- `apps/hospital-service/src/transfers/transfers.service.ts` - Transfer workflow
- `apps/hospital-service/src/database/migrations/001_initial.ts` - Hospital schema

### Frontend
- `apps/web/src/lib/auth/AuthProvider.tsx` - Auth context
- `apps/web/src/lib/api/client.ts` - API client
- `apps/web/src/app/page.tsx` - Landing page
- `apps/web/src/app/(auth)/login/page.tsx` - Login page
- `apps/web/src/app/(dashboard)/layout.tsx` - Dashboard layout
- `apps/web/src/components/layout/Sidebar.tsx` - Sidebar with menu structure

### Shared Packages
- `packages/shared-types/src/index.ts` - Shared types
- `packages/shared-config/` - Shared configs

## Estimated Timeline

- **Phase 0:** 2 days (Setup)
- **Phase 1:** 3 days (Backend services)
- **Phase 2:** 2 days (API Gateway)
- **Phase 3:** 3 days (Frontend)
- **Phase 4:** 2 days (Integration & Testing)
- **Phase 5:** 2 days (Monitoring & Documentation)

**Total:** ~14 days for skeleton project

## Success Criteria

The skeleton project is complete when:

✅ User can access a professional landing page
✅ User can login with email/password
✅ System issues JWT access and refresh tokens
✅ Tokens refresh automatically
✅ User sees personalized dashboard
✅ Admin can view, create, edit, delete users
✅ Admin can assign roles to users
✅ Admin can manage roles and permissions
✅ All actions are audit logged
✅ Permission-based UI rendering works
✅ Unauthorized actions are blocked
✅ All services monitored with Prometheus/Grafana
✅ API documentation available via Swagger
✅ All tests passing
✅ Documentation complete

---

**Note:** This plan prioritizes building a solid, production-ready foundation. The modular architecture allows adding new clinical modules incrementally without refactoring core systems.
