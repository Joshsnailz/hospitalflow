# Clinical Portal 2.0 - Implementation Plan

## Project Overview

A comprehensive, HIPAA/GDPR-compliant clinical portal covering the entire patient journey from registration to discharge. The initial skeleton focuses on authentication, RBAC, and modern UI foundation.

## Technical Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS microservices, PostgreSQL, Redis, RabbitMQ
- **Infrastructure:** Docker Compose, Prometheus/Grafana
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
│   └── audit-service/          # Audit logging
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── shared-config/          # ESLint, Prettier configs
│   ├── shared-utils/           # Utility functions
│   ├── api-client/             # Frontend API client
│   └── rbac/                   # RBAC logic library
├── infrastructure/
│   ├── docker/                 # Dockerfiles
│   ├── monitoring/             # Prometheus/Grafana configs
│   └── nginx/                  # Reverse proxy configs
├── scripts/                    # Setup and utility scripts
├── docker-compose.yml
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

### Docker Compose Services

- **Databases:** postgres-auth, postgres-user, postgres-rbac, postgres-audit
- **Cache/Queue:** redis, rabbitmq
- **Services:** auth-service, user-service, rbac-service, audit-service, api-gateway
- **Frontend:** web (Next.js)
- **Monitoring:** prometheus, grafana

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
5. Create docker-compose.yml with all services
6. Create .env.example with all required variables
7. Set up GitHub repository and initial commit

**Critical Files:**
- `turbo.json` - Monorepo build pipeline
- `docker-compose.yml` - Infrastructure definition
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
1. Start all services with `docker-compose up`
2. Run database migrations for all services
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
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # User
curl http://localhost:3003/health  # RBAC
curl http://localhost:3004/health  # Audit
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

## Next Steps (Future Modules)

After skeleton is complete, implement in order:

1. **Patient Management Module**
   - Patient registration and demographics
   - Medical history
   - Insurance information

2. **Appointment Scheduling**
   - Calendar management
   - Doctor availability
   - Booking system

3. **Electronic Medical Records (EMR)**
   - Clinical documentation
   - Visit notes
   - Treatment plans

4. **Lab Orders & Results**
   - Order tests
   - View results
   - Integration with lab systems

5. **Medication Management**
   - Prescription writing
   - Medication tracking
   - Pharmacy integration

6. **Discharge Planning (EDC)**
   - Implement full workflow from permissions.xlsx
   - Multi-stage approval process
   - Pharmacy integration

Each module follows the same pattern:
1. Create microservice
2. Define database schema
3. Add API endpoints
4. Integrate with API Gateway
5. Add RBAC permissions
6. Build frontend UI
7. Add audit logging
8. Test and deploy

## Critical Files Reference

### Infrastructure
- `turbo.json` - Monorepo configuration
- `docker-compose.yml` - Service orchestration
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

### Frontend
- `apps/web/src/lib/auth/AuthProvider.tsx` - Auth context
- `apps/web/src/lib/api/client.ts` - API client
- `apps/web/src/app/page.tsx` - Landing page
- `apps/web/src/app/(auth)/login/page.tsx` - Login page
- `apps/web/src/app/(dashboard)/layout.tsx` - Dashboard layout

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
