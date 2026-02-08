# Audit Trail Not Displaying - Root Cause Analysis

## Problem
The audit trail page at `/admin/audit` shows no audits even though the code is implemented correctly.

## Root Cause

The audit infrastructure IS working correctly:

1. ✅ **Audit Service**: Consumes audit events from RabbitMQ queue `audit.logs`
2. ✅ **Event Publisher**: Services publish audit events to `clinical.audit` exchange
3. ✅ **API Gateway**: Properly routes `/audit/*` requests to audit-service
4. ✅ **Frontend**: Correctly calls `/audit/logs` API endpoint
5. ✅ **Login Auditing**: Auth-service publishes audit log on successful login (auth.service.ts:98-105)

**The Real Issue**: No audit logs exist in the database until users actually perform actions.

## Why Audits Are Empty

### 1. No Initial Seed Data
The seed scripts create users, patients, hospitals, but **don't publish audit logs** for these seed operations.

### 2. First-Time Usage
On a fresh deployment:
- Services start → databases seeded → NO audit logs created
- Users must log in / perform actions to generate audits
- But if user checks audit page BEFORE performing actions, it appears broken

## Solution: Add Audit Logging to Seed Scripts

### What Needs to Be Fixed

1. **Auth-service seed** should publish audit logs when creating users
2. **Patient-service seed** should publish audit logs when creating patients
3. **Hospital-service seed** should publish audit logs when creating hospitals

This ensures the audit trail has initial data for testing.

## How Audit Flow Works

```
User Action (Login/Create/Update/Delete)
  ↓
Service calls eventPublisher.publishAuditLog()
  ↓
RabbitMQ receives event on exchange: clinical.audit
  ↓
Audit-service consumes from queue: audit.logs
  ↓
Audit-service stores in audit_db
  ↓
Frontend queries /audit/logs
  ↓
Audits displayed in UI
```

## Testing the Fix

### Step 1: Verify Services Are Running
```bash
docker-compose ps
# All services should be "Up"
```

### Step 2: Verify RabbitMQ Connection
```bash
# Check audit-service logs
docker logs audit-service | grep "RabbitMQ"
# Should see: "RabbitMQ consumer connected"

# Check auth-service logs
docker logs auth-service | grep "RabbitMQ"
# Should see: "Connected to RabbitMQ"
```

### Step 3: Verify Queue Exists
```bash
# Access RabbitMQ Management UI
open http://localhost:15672
# Login: guest / guest
# Navigate to Queues → should see "audit.logs"
```

### Step 4: Check Database
```bash
# Check if any audits exist
docker exec -it postgres psql -U postgres -d audit_db \
  -c "SELECT COUNT(*) FROM audit_logs;"

# Should show count > 0 if audits have been published
```

### Step 5: Test Manual Audit Creation

#### Option A: Login (Creates Audit)
```bash
# Login via API (creates audit log)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@clinical-portal.com",
    "password": "Admin123!"
  }'

# Check audit logs again
docker exec -it postgres psql -U postgres -d audit_db \
  -c "SELECT action, user_email, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

#### Option B: Create Patient (Creates Audit)
```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@clinical-portal.com","password":"Admin123!"}' \
  | jq -r '.data.tokens.accessToken')

# Create a patient
curl -X POST http://localhost:3000/api/v1/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "chiNumber": "99999999X99",
    "firstName": "Test",
    "lastName": "Patient",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "contactDetails": {
      "phoneNumber": "0771234567",
      "email": "test@test.com",
      "address": "123 Test St"
    }
  }'

# Check audits
docker logs audit-service | tail -20
```

## Verification Checklist

- [ ] RabbitMQ is running and accessible
- [ ] Audit-service is connected to RabbitMQ
- [ ] Auth-service is connected to RabbitMQ
- [ ] Performed at least one login action
- [ ] Checked audit_db has records
- [ ] Frontend can fetch from /audit/logs

## Expected Behavior After Fix

1. **After Seeding**: ~50-100 audit logs from seed operations
2. **After Login**: Additional LOGIN audit log
3. **After Actions**: CREATE/UPDATE/DELETE logs for each action
4. **Frontend Display**: Audit page shows all logs with filters working

## Files to Modify

1. `apps/auth-service/src/database/seeds/run-seed.ts`
   - Add audit log publishing for each seeded user

2. `apps/patient-service/src/database/seeds/run-seed.ts`
   - Add audit log publishing for each seeded patient

3. `apps/hospital-service/src/database/seeds/run-seed.ts`
   - Add audit log publishing for each seeded hospital

---

**Next Step**: Modify seed scripts to publish audit events for initial data.
