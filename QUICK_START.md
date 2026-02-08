# Clinical Portal - Quick Start Guide

## 🎯 Issues Resolved

### 1. ✅ Clinician Dropdown Fixed
**Problem**: Dropdown was empty when booking appointments
**Root Cause**: `user_db` was not synced from `auth_db`
**Solution**: Implemented event-driven synchronization via RabbitMQ
- Auth-service now publishes `user.created` events when users are created
- User-service automatically consumes these events and syncs users
- Works for both seeding AND runtime user creation

### 2. ✅ Patient Data Available
**Problem**: No test patients for testing
**Solution**: Created seed script with 5 sample patients

### 3. ✅ Audit Trail Fixed
**Problem**: Appeared empty after seeding
**Root Cause**: Seed scripts didn't publish audit logs
**Solution**: Updated seed to publish audit.log events for each user created
**Result**: 10 audit logs immediately visible after seeding

### 4. ✅ Discharge Form Verified
**Status**: Already complete with all 5 sections working

## 🚀 Getting Started (3 Steps)

### Step 1: Start Services First

**Important**: User-service must be running to receive events!

```bash
# Option A: Docker (Recommended)
docker-compose up --build -d

# Option B: Manual
npm run dev
```

### Step 2: Seed All Databases

**Option A - Use the automated script** (Recommended):
```bash
./scripts/seed-all.sh
```

**Option B - Manual seeding**:
```bash
# Auth-service will publish events that user-service consumes
cd apps/auth-service && npm run seed && cd ../..

# Other services
cd apps/rbac-service && npm run seed && cd ../..
cd apps/hospital-service && npm run seed && cd ../..
cd apps/patient-service && npm run seed && cd ../..

# User-service syncs automatically via RabbitMQ - no manual seed needed!
```

**What Happens**:
1. Auth-service creates users in `auth_db`
2. Publishes `user.created` events to RabbitMQ → user-service syncs
3. Publishes `audit.log` events to RabbitMQ → audit-service stores logs
4. User-service receives events and creates users in `user_db`
5. Audit-service receives events and creates audit logs in `audit_db`
6. ✅ All databases synchronized with initial audit trail!

### Step 3: Access the Application

1. **Open**: http://localhost:3100
2. **Login**: `admin@clinical-portal.com` / `Admin123!`
3. **Test the patient journey**:
   - View patients: `/patients`
   - Book appointment: `/appointments/new` (dropdown now works!)
   - Emergency care: `/clinical/emergency`
   - Discharge: `/discharge/clinical`
   - Audit trail: `/admin/audit`

## 🧪 Test Data Available

### Users (10 total)
- **1 Admin**: admin@clinical-portal.com / Admin123!
- **6 Doctors**: doctor@clinical-portal.com, doctor2-5@clinical-portal.com / Doctor123!
- **1 Nurse**: nurse@clinical-portal.com / Nurse123!
- **1 Pharmacist**: pharmacist@clinical-portal.com / Pharma123!
- **1 Consultant**: consultant@clinical-portal.com / Consult123!

### Patients (5 total)
- Tafadzwa Moyo - CHI: 70282487G70
- Rudo Ndlovu - CHI: 81234567H82
- Tatenda Chikwamba - CHI: 92345678K93
- Nokuthula Sibanda - CHI: 63456789M64
- Blessing Mutasa - CHI: 54567890P55

### Hospital
- Parirenyatwa Group of Hospitals
- 7 Departments
- 9 Wards
- 160+ Beds

## ✅ What's Working Now

### Patient Journey (Complete)
1. ✅ Patient Registration (`/patients/add`)
2. ✅ Patient Search (`/patients/search`)
3. ✅ Appointment Booking (`/appointments/new`) - **DROPDOWN NOW WORKS!**
4. ✅ Emergency Triage (`/clinical/emergency`)
5. ✅ Discharge Process (`/discharge/[id]`)
6. ✅ Audit Tracking (`/admin/audit`)

### All Frontend Pages
- ✅ All navigation links work
- ✅ All forms display correctly
- ✅ No blank/dead links
- ✅ Data loads properly (after seeding)

### Backend Services
- ✅ 8 microservices running
- ✅ API Gateway routing
- ✅ Database per service
- ✅ RabbitMQ event bus
- ✅ Swagger docs available

## 🐛 Troubleshooting

### Clinician dropdown still empty?
```bash
# 1. Check RabbitMQ is running
curl http://localhost:15672/

# 2. Check user-service is connected
docker logs user-service | grep "Connected to RabbitMQ"

# 3. Check if users were synced
docker exec -it clinical_portal_postgres_user psql -U postgres -d user_db -c "SELECT email, role FROM users WHERE role='doctor';"

# 4. If empty, check RabbitMQ queue
curl -u guest:guest http://localhost:15672/api/queues/%2F/user-service.user.created

# 5. Restart user-service to process queued events
docker-compose restart user-service

# 6. Watch the sync happen
docker logs -f user-service
```

### No patients showing?
```bash
# 1. Check patient-service
curl http://localhost:3005/healthcheck

# 2. Check database
docker exec -it clinical_portal_postgres_patient psql -U postgres -d patient_db -c "SELECT COUNT(*) FROM patients;"

# 3. Re-run seed
cd apps/patient-service && npm run seed
```

### Audit trail empty?
After seeding, you should see 10 "REGISTER" audit logs. If empty:
```bash
# Check audit-service logs
docker logs audit-service | grep "Processed audit log"

# Check database
docker exec -it postgres psql -U postgres -d audit_db -c "SELECT COUNT(*) FROM audit_logs;"

# If still empty, restart audit-service
docker-compose restart audit-service
```

## 📚 Additional Resources

- **Event-Driven Architecture**: See `EVENT_DRIVEN_SETUP.md` - **READ THIS!**
- **Full Documentation**: See `FIXES_APPLIED.md` for comprehensive details
- **Implementation Plan**: See `Implementation Plan.md`
- **Business Logic**: See `Business Logic.md`
- **API Docs**: http://localhost:3000/api/docs (when running)

## 🎓 Form Validation Status

### Backend ✅ Excellent
All DTOs use class-validator with proper constraints.

### Frontend ⚠️ Basic
Manual validation currently. Recommendations for improvement:
- Add Zod schemas for type safety
- Use React Hook Form for better UX
- See `FIXES_APPLIED.md` for examples

## 📋 Next Steps (Optional Enhancements)

1. **Add Zod Validation Schemas**
   - Install: `npm install zod @hookform/resolvers react-hook-form`
   - See examples in `FIXES_APPLIED.md`

2. **Complete Missing Features**
   - Laboratory Results
   - Prescription Management
   - Billing & Insurance
   - Staff Scheduling
   - Reporting

3. **Event-Driven Architecture** ✅ DONE!
   - ✅ Auth-service publishes RabbitMQ events on user creation
   - ✅ User-service consumes events automatically
   - ✅ Works for both seeding and runtime user creation
   - See `EVENT_DRIVEN_SETUP.md` for details

## ✨ Summary

**All reported issues have been resolved:**
- ✅ Clinician dropdown now shows all doctors (event-driven sync via RabbitMQ)
- ✅ Patient data available for testing
- ✅ Audit trail fixed - seed creates 10 initial audit logs
- ✅ Discharge form verified complete
- ✅ Dashboard navigation fixed - 7 broken links corrected
- ✅ All UI components working
- ✅ Form validation present (backend excellent, frontend basic)
- ✅ **New users + audit logs created at runtime automatically sync across services!**

**To use the system:**
1. Start services: `docker-compose up -d` or `npm run dev`
2. Seed: `./scripts/seed-all.sh`
3. Login: http://localhost:3100 with `admin@clinical-portal.com` / `Admin123!`

**Important**: Services must be running BEFORE seeding so user-service can receive events!

Enjoy using the Clinical Portal! 🏥
