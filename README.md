# Clinical Portal 2.0

A comprehensive, HIPAA/GDPR-compliant clinical portal covering the entire patient journey from registration to discharge, built with modern technologies and best practices.

## 🏥 Overview

Clinical Portal 2.0 is an enterprise-grade healthcare management system designed to streamline clinical workflows, ensure data security, and maintain regulatory compliance. The platform features a microservices architecture with a modern, intuitive user interface.

## ✨ Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens and RBAC
- **User Management**: Comprehensive user and role management
- **Audit Logging**: HIPAA-compliant audit trails for all system actions
- **Modern UI**: Built with Next.js 14, Tailwind CSS, and shadcn/ui
- **Microservices**: Scalable backend architecture with NestJS
- **Monitoring**: Prometheus and Grafana for observability
- **Security**: Encryption at rest and in transit, input validation, rate limiting

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS microservices, TypeScript
- **Database**: PostgreSQL 16 (database-per-service)
- **Cache**: Redis 7
- **Message Queue**: RabbitMQ 3
- **Monitoring**: Prometheus + Grafana
- **Infrastructure**: Docker Compose
- **Monorepo**: Turborepo

### Microservices

1. **API Gateway** (Port 3000) - Single entry point, routing, JWT validation
2. **Auth Service** (Port 3001) - Authentication, JWT token management
3. **User Service** (Port 3002) - User CRUD operations, profile management
4. **RBAC Service** (Port 3003) - Roles, permissions, authorization
5. **Audit Service** (Port 3004) - HIPAA-compliant logging
6. **Patient Service** (Port 3005) - Patient registration and records
7. **Clinical Service** (Port 3006) - Encounters, appointments, care plans, discharge
8. **Hospital Service** (Port 3007) - Hospital, department, ward, and bed management

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- Git

### Quick Start (Docker — recommended)

A single command builds all services, creates databases, seeds data, and starts everything:

```bash
# 1. Clone and enter the repo
git clone <repository-url>
cd Clinical_Portal_2.0

# 2. Copy environment file
cp .env.example .env

# 3. Build and start the entire stack
docker compose up --build -d
```

This will:
- Install all dependencies and build every service (NestJS + Next.js) inside Docker
- Start 7 PostgreSQL databases, RabbitMQ, and Redis
- Create all database tables via TypeORM synchronize
- Seed demo users (auth-service), RBAC roles/permissions (rbac-service), and hospital data (hospital-service)
- Start all 8 backend services, the API gateway, the web frontend, Prometheus, and Grafana
- Health-check every service before starting dependents (API gateway waits for all backends; web waits for gateway; monitoring waits for gateway)

Wait ~2-3 minutes for the initial build, then verify:

```bash
# All containers should show "healthy" or "Up"
docker compose ps

# Test key endpoints
curl http://localhost:3000/healthcheck   # API Gateway
curl http://localhost:3001/healthcheck   # Auth Service
curl http://localhost:3100               # Web Frontend
curl http://localhost:9090/-/healthy     # Prometheus
curl http://localhost:3200/api/health    # Grafana

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@clinical-portal.com","password":"Admin123!"}'
```

To tear down and reset all data:

```bash
docker compose down -v
```

### Local Development (without Docker)

```bash
npm install
npm run dev    # Starts all services via Turborepo in dev/watch mode
```

You will need local PostgreSQL, Redis, and RabbitMQ instances (or start just infrastructure via `docker compose up -d postgres-auth postgres-user postgres-rbac postgres-audit postgres-patient postgres-clinical postgres-hospital rabbitmq redis`).

### Demo Credentials

Seeded automatically on first Docker startup:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@clinical-portal.com` | `Admin123!` |
| Doctor | `doctor@clinical-portal.com` | `Doctor123!` |
| Clinical Admin | `clinicaladmin@clinical-portal.com` | `ClinAdmin123!` |
| Nurse | `nurse@clinical-portal.com` | `Nurse123!` |
| Pharmacist | `pharmacist@clinical-portal.com` | `Pharma123!` |
| Consultant | `consultant@clinical-portal.com` | `Consult123!` |

### Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3100 | Next.js web application |
| **API Gateway** | http://localhost:3000 | Main API entry point |
| **API Gateway Swagger** | http://localhost:3000/api/docs | Interactive API documentation |
| **Auth Service Swagger** | http://localhost:3001/api/docs | Auth service API documentation |
| **Grafana** | http://localhost:3200 | Monitoring dashboards (admin/admin123) |
| **Prometheus** | http://localhost:9090 | Metrics collection |
| **RabbitMQ Management** | http://localhost:15672 | Message queue UI |

### Health Check Endpoints

Every service exposes `/healthcheck`. Docker Compose health checks run automatically. To test manually:

```bash
curl http://localhost:3000/healthcheck   # API Gateway
curl http://localhost:3001/healthcheck   # Auth
curl http://localhost:3002/healthcheck   # User
curl http://localhost:3003/healthcheck   # RBAC
curl http://localhost:3004/healthcheck   # Audit
curl http://localhost:3005/healthcheck   # Patient
curl http://localhost:3006/healthcheck   # Clinical
curl http://localhost:3007/healthcheck   # Hospital
```

### Docker Architecture

The production Docker setup uses a multi-stage build:

- **`Dockerfile`** — Two-stage build (`builder` + `runner`). The builder installs dependencies via `npm ci`, builds all NestJS services with Turborepo, and builds the Next.js frontend. The runner stage copies the built output for a clean production image.
- **`docker-entrypoint.sh`** — Entrypoint script for backend services. Runs database seed scripts (auth, rbac, hospital) on first startup using a marker file to prevent re-seeding, then starts the service.
- **`docker-compose.yml`** — Orchestrates all services with health-check-based dependency chains, `restart: unless-stopped`, and `start_period` grace periods.

All application services share a single Docker image (`clinical-portal`) built once, with different `command` overrides to start each service.

## 📁 Project Structure

```
clinical-portal/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api-gateway/            # API Gateway (port 3000)
│   ├── auth-service/           # Authentication service (port 3001)
│   ├── user-service/           # User management service (port 3002)
│   ├── rbac-service/           # RBAC service (port 3003)
│   ├── audit-service/          # Audit logging service (port 3004)
│   ├── patient-service/        # Patient management (port 3005)
│   ├── clinical-service/       # Clinical workflows (port 3006)
│   └── hospital-service/       # Hospital/ward/bed management (port 3007)
├── packages/
│   └── shared-types/           # Shared TypeScript types
├── libs/
│   └── shared/                 # Shared utilities
├── infrastructure/
│   ├── grafana/                # Grafana provisioning & dashboards
│   ├── prometheus/             # Prometheus config & alerts
│   └── rabbitmq/               # RabbitMQ definitions & config
├── Dockerfile                  # Multi-stage production build
├── docker-entrypoint.sh        # Service startup script with seeding
├── docker-compose.yml          # Full stack orchestration
├── turbo.json
└── package.json
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev              # Start all services in development mode
npm run build            # Build all applications
npm run lint             # Lint all code
npm run format           # Format code with Prettier
npm run test             # Run all tests
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run end-to-end tests
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:logs      # View Docker logs
npm run migrate          # Run database migrations
npm run seed             # Seed databases
```

### Code Quality

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Configured with TypeScript rules
- **Prettier**: Automatic code formatting
- **Testing**: Jest for backend, Playwright for E2E
- **Coverage**: 80% target

## 🔒 Security & Compliance

### HIPAA Compliance

- ✅ Unique user identification
- ✅ Automatic session timeout (15 minutes)
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

- bcrypt password hashing (cost factor 12)
- JWT with short-lived access tokens (15 min)
- Refresh token rotation
- Rate limiting (Redis-based)
- Input validation (class-validator, Zod)
- SQL injection protection (ORM)
- XSS protection (CSP, React auto-escaping)
- CSRF protection (SameSite cookies)

## 📊 Monitoring

Access monitoring dashboards:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3200

Default Grafana credentials: `admin` / `admin` (change after first login)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Test specific service
npm run test --filter=auth-service
```

## 📚 Documentation

- [Implementation Plan](./Implementation%20Plan.md) - Detailed implementation roadmap
- [Architecture Documentation](./docs/ARCHITECTURE.md) - System architecture (coming soon)
- [Security Guidelines](./docs/SECURITY.md) - Security practices (coming soon)
- [API Documentation](http://localhost:3000/api/docs) - Interactive API docs (Swagger)

## 🗺️ Roadmap

### Phase 0: Project Setup ✅ (Completed)
- Monorepo initialization with Turborepo
- Docker Compose infrastructure setup
- Configuration files and environment templates

### Phase 1: Backend Services ✅ (Completed)
- ✅ Auth Service (login, register, refresh, logout, JWT with roles)
- ⏳ User Service (planned)
- ⏳ RBAC Service (planned)
- ⏳ Audit Service (planned)

### Phase 2: API Gateway ✅ (Completed)
- ✅ Route proxying to microservices
- ✅ JWT validation
- ✅ Swagger UI documentation
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Request logging

### Phase 3: Frontend Foundation ✅ (Completed)
- ✅ Landing page with modern healthcare design
- ✅ Login page with API integration
- ✅ Auth context and token management
- ✅ Protected dashboard with medical stats
- ✅ Responsive sidebar and header
- ⏳ User/Role management UI (planned)

### Phase 4: Integration & Testing (In Progress)
- ✅ Frontend-backend authentication flow
- ⏳ End-to-end testing
- ⏳ Comprehensive unit tests
- ⏳ Performance optimization

### Phase 5: Monitoring & Documentation (Planned)
- ⏳ Grafana dashboards
- ⏳ Complete API documentation
- ⏳ Deployment guide

### Future Modules
- Patient Management
- Appointment Scheduling
- Electronic Medical Records (EMR)
- Lab Orders & Results
- Medication Management
- Discharge Planning (EDC)
- Billing & Insurance

## 👥 User Roles

The system supports the following clinical roles:

1. Consultant
2. Doctor/Physician
3. Hospital Pharmacist
4. Pharmacy Technician
5. Pharmacy Support Worker
6. Pharmacy Support Worker Manager
7. Clinical Admin/Receptionist
8. Prescriber
9. Nurse
10. Patient
11. Super Admin

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/CP-123-description`
2. Make your changes
3. Run tests: `npm run test`
4. Commit: `git commit -m "feat(scope): description"`
5. Push: `git push origin feature/CP-123-description`
6. Create a Pull Request

### Commit Convention

Follow conventional commits:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For questions or issues:
- Check the [Implementation Plan](./Implementation%20Plan.md)
- Review API documentation at http://localhost:3000/api/docs
- Contact the development team

---

**Built with ❤️ for healthcare professionals**
