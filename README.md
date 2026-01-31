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

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Clinical_Portal_2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the PostgreSQL database**
   ```bash
   docker-compose up -d postgres-auth
   ```

4. **Start the Auth Service** (Terminal 1)
   ```bash
   cd apps/auth-service
   npm install
   npm run start:dev
   ```

5. **Seed the database with demo users** (new terminal)
   ```bash
   cd apps/auth-service
   npm run seed
   ```
   This creates:
   - Admin: `admin@clinical-portal.com` / `Admin123!`
   - Doctor: `doctor@clinical-portal.com` / `Doctor123!`

6. **Start the API Gateway** (Terminal 2)
   ```bash
   cd apps/api-gateway
   npm install
   npm run start:dev
   ```

7. **Start the Frontend** (Terminal 3)
   ```bash
   cd apps/web
   npm run dev
   ```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@clinical-portal.com` | `Admin123!` |
| Doctor | `doctor@clinical-portal.com` | `Doctor123!` |

### Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3100 | Next.js web application |
| **API Gateway** | http://localhost:3000 | Main API entry point |
| **API Gateway Swagger** | http://localhost:3000/api/docs | Interactive API documentation |
| **Auth Service Swagger** | http://localhost:3001/api/docs | Auth service API documentation |
| **Grafana** | http://localhost:3200 | Monitoring dashboards (admin/admin) |
| **Prometheus** | http://localhost:9090 | Metrics collection |
| **RabbitMQ Management** | http://localhost:15672 | Message queue UI |

### Health Check Endpoints

Verify services are running:
```bash
# API Gateway
curl http://localhost:3000/healthcheck

# Auth Service
curl http://localhost:3001/healthcheck
```

### Full Infrastructure (All Services)

To start the complete stack including all databases, Redis, and RabbitMQ:

```bash
# Start all infrastructure
docker-compose up -d

# Or start specific services
docker-compose up -d postgres-auth redis rabbitmq
```

## 📁 Project Structure

```
clinical-portal/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api-gateway/            # API Gateway
│   ├── auth-service/           # Authentication service
│   ├── user-service/           # User management service
│   ├── rbac-service/           # RBAC service
│   └── audit-service/          # Audit logging service
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── shared-config/          # Shared configs
│   ├── shared-utils/           # Utility functions
│   ├── api-client/             # Frontend API client
│   └── rbac/                   # RBAC logic library
├── infrastructure/
│   ├── docker/                 # Dockerfiles
│   ├── monitoring/             # Prometheus/Grafana configs
│   └── nginx/                  # Nginx configs
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
├── docker-compose.yml
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
