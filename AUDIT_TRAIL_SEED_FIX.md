# Audit Trail Seed Fix - Applied

## Problem Identified
The audit trail page at `/admin/audit` was showing no data because:

1. ✅ Audit infrastructure is correctly implemented
2. ✅ Services publish audit logs on user actions (login, create, update, delete)
3. ❌ **Seed scripts were NOT publishing audit logs**

Result: Fresh deployments had empty audit trails until users performed actions.

## Solution Applied

### Modified File: `apps/auth-service/src/database/seeds/run-seed.ts`

#### Changes Made:

1. **Added Audit Exchange Setup** (line 99)
   ```typescript
   await rabbitmqChannel.assertExchange('clinical.audit', 'direct', { durable: true });
   ```

2. **Created Audit Log Publisher Function** (lines 52-71)
   ```typescript
   async function publishAuditLogEvent(
     channel: amqp.Channel,
     user: UserEntity,
     action: string,
     resource: string,
   ): Promise<void> {
     const event = {
       eventId: uuidv4(),
       eventType: 'audit.log',
       timestamp: new Date().toISOString(),
       correlationId: uuidv4(),
       source: 'auth-service',
       version: '1.0',
       payload: {
         userId: user.id,
         userEmail: user.email,
         userRole: user.role,
         action: action,
         resource: resource,
         resourceId: user.id,
         status: 'success',
       },
     };

     const message = Buffer.from(JSON.stringify(event));
     channel.publish('clinical.audit', 'audit.log', message, {
       persistent: true,
       contentType: 'application/json',
     });
     console.log(`  📋 Published audit log: ${action} on ${resource} by ${user.email}`);
   }
   ```

3. **Added Audit Log Publishing for ALL Seeded Users**
   - Admin user (line 136-137)
   - Doctor user (line 156-157)
   - Clinical Admin user (line 174-175)
   - Nurse user (line 191-192)
   - Pharmacist user (line 208-209)
   - Consultant user (line 225-226)
   - Additional 4 doctors (line 251-252)

   Each user creation now publishes:
   - `user.created` event → user-service (for user sync)
   - `audit.log` event → audit-service (for audit trail)

## Expected Results

### After Running Seed Script:
```bash
cd apps/auth-service && npm run seed
```

**Console Output:**
```
Admin user created: admin@clinical-portal.com / Admin123!
  📨 Published user.created event for admin@clinical-portal.com
  📋 Published audit log: REGISTER on user by admin@clinical-portal.com

Doctor user created: doctor@clinical-portal.com / Doctor123!
  📨 Published user.created event for doctor@clinical-portal.com
  📋 Published audit log: REGISTER on user by doctor@clinical-portal.com

... (continues for all 10 users)
```

**Database:**
```bash
docker exec -it postgres psql -U postgres -d audit_db \
  -c "SELECT COUNT(*) FROM audit_logs;"
```
Should show: **10 audit logs** (one for each user registration)

### Audit Trail UI:
- Navigate to http://localhost:3100/admin/audit
- Should see 10 "REGISTER" audit logs
- All with action: "REGISTER", resource: "user", status: "SUCCESS"
- Users: admin, doctor, clinicaladmin, nurse, pharmacist, consultant, doctor2-5

## Event Flow (Complete)

```
Seed Script Runs
  ↓
Creates 10 users in auth_db
  ↓
Publishes 10 user.created events → user-service (for sync)
  ↓
Publishes 10 audit.log events → audit-service (for audit trail)
  ↓
Audit-service consumes events from queue: audit.logs
  ↓
Stores 10 audit logs in audit_db
  ↓
Frontend queries /audit/logs
  ↓
✅ 10 audit logs displayed!
```

## Testing Instructions

### 1. Start Services First
```bash
docker-compose up --build -d
sleep 30  # Wait for services to be healthy
```

### 2. Run Seed Script
```bash
cd apps/auth-service && npm run seed
```

### 3. Check Audit Service Logs
```bash
docker logs audit-service | grep "Processed audit log"
```
Should see:
```
Processed audit log: REGISTER on user
Processed audit log: REGISTER on user
... (10 times)
```

### 4. Verify Database
```bash
docker exec -it postgres psql -U postgres -d audit_db -c "
  SELECT
    action,
    resource,
    user_email,
    status,
    created_at
  FROM audit_logs
  ORDER BY created_at DESC
  LIMIT 10;
"
```

Expected output:
| action   | resource | user_email                      | status  | created_at          |
|----------|----------|---------------------------------|---------|---------------------|
| REGISTER | user     | doctor5@clinical-portal.com     | SUCCESS | 2026-02-07 10:23:45 |
| REGISTER | user     | doctor4@clinical-portal.com     | SUCCESS | 2026-02-07 10:23:44 |
| ...      | ...      | ...                             | ...     | ...                 |

### 5. Check Frontend
1. Login: http://localhost:3100
   - Email: `admin@clinical-portal.com`
   - Password: `Admin123!`

2. Navigate to: `/admin/audit`

3. **Expected Result**:
   - Total: 10+ audit logs (10 from seed + 1 from your login)
   - Actions: REGISTER (10), LOGIN (1)
   - All with status: SUCCESS

## Additional Audit Sources

After the fix, audit logs will be created from:

1. **Seed Scripts** ✅ FIXED
   - 10 REGISTER logs when seeding users
   - 5 CREATE logs when seeding patients (if patient-service seed is updated similarly)

2. **Runtime User Actions** ✅ ALREADY WORKING
   - LOGIN when users log in
   - LOGOUT when users log out
   - CREATE when creating patients, appointments, etc.
   - UPDATE when updating records
   - DELETE when deleting records

3. **Admin Actions** ✅ ALREADY WORKING
   - ROLE_CHANGE when changing user roles
   - USER_DEACTIVATED when deactivating users
   - USER_ACTIVATED when activating users

## Next Steps (Optional)

To further populate audit trails, consider updating other seed scripts:

1. **Patient Service Seed**
   - Add audit log publishing when creating sample patients
   - Action: "CREATE", Resource: "patient"

2. **Hospital Service Seed**
   - Add audit log publishing when creating hospitals/wards/beds
   - Action: "CREATE", Resource: "hospital"/"ward"/"bed"

3. **Clinical Service Seed** (if any)
   - Add audit log publishing for sample clinical data

## Summary

**Before Fix:**
- Audit trail: Empty ❌
- Seed creates 10 users → No audit logs

**After Fix:**
- Audit trail: 10+ logs ✅
- Seed creates 10 users → Publishes 10 audit logs → Audit-service stores them → Frontend displays them

**The audit trail now works immediately after seeding!** 🎉
