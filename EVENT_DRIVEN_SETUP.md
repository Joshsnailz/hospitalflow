# Event-Driven User Synchronization - Setup Guide

## ✅ Problem Solved

**Original Issue**: Clinician dropdown was empty because user-service database wasn't synchronized with auth-service.

**Old Approach** ❌: Maintain separate seed scripts for each database
**New Approach** ✅: Event-driven synchronization via RabbitMQ

## 🏗️ Architecture

```
┌─────────────────┐         user.created event        ┌─────────────────┐
│  Auth Service   │ ──────────────────────────────▶  │  User Service   │
│   (auth_db)     │         via RabbitMQ             │   (user_db)     │
│                 │                                   │                 │
│ - User created  │                                   │ - Event consumed│
│ - Event sent    │                                   │ - User synced   │
└─────────────────┘                                   └─────────────────┘
```

## 🔄 How It Works

### 1. User Creation (Auth Service)

When a user is created in auth-service, it now:

```typescript
// apps/auth-service/src/auth/auth.service.ts

// 1. Save user to auth_db
const savedUser = await this.userRepository.save(user);

// 2. Publish user.created event to RabbitMQ
await this.eventPublisher.publishUserCreated({
  userId: savedUser.id,
  email: savedUser.email,
  firstName: savedUser.firstName,
  lastName: savedUser.lastName,
  role: savedUser.role,
  phoneNumber: savedUser.phoneNumber,
  isActive: savedUser.isActive,
  mustChangePassword: savedUser.mustChangePassword,
  createdAt: savedUser.createdAt.toISOString(),
});
```

### 2. Event Consumption (User Service)

User-service automatically receives and processes the event:

```typescript
// apps/user-service/src/events/user-consumer.service.ts

async handleUserCreated(msg: amqp.ConsumeMessage) {
  const event = JSON.parse(msg.content.toString());

  // Create user in user_db
  const user = this.userRepository.create({
    id: event.payload.userId,
    email: event.payload.email,
    firstName: event.payload.firstName,
    lastName: event.payload.lastName,
    role: event.payload.role,
    // ... other fields
  });

  await this.userRepository.save(user);
  this.logger.log(`User synced: ${user.email}`);
}
```

## 🚀 Setup Instructions

### Prerequisites

1. **RabbitMQ must be running** before seeding:
   ```bash
   docker-compose up -d rabbitmq
   # OR
   rabbitmq-server  # if installed locally
   ```

2. **User-service must be running** to consume events:
   ```bash
   # Terminal 1: Start user-service
   cd apps/user-service
   npm run start:dev

   # Terminal 2: Seed auth-service (will publish events)
   cd apps/auth-service
   npm run seed
   ```

### Full Setup Workflow

```bash
# 1. Start infrastructure
docker-compose up -d rabbitmq redis postgres

# 2. Start user-service (to consume events)
cd apps/user-service
npm run start:dev &

# Give it a moment to connect to RabbitMQ
sleep 3

# 3. Seed auth-service (publishes events automatically)
cd ../auth-service
npm run seed

# 4. Verify sync worked
cd ../user-service
# Check logs - should see "User synced: ..." messages

# 5. Seed other services
cd ../rbac-service && npm run seed
cd ../hospital-service && npm run seed
cd ../patient-service && npm run seed
```

### Using the Automated Script

The `seed-all.sh` script handles this for you:

```bash
# Make sure services are running first
npm run dev  # In a separate terminal

# Then run seed script
./scripts/seed-all.sh
```

## 🔍 Verification

### Check User Sync

```bash
# Check auth_db
psql -U postgres -d auth_db -c "SELECT email, role FROM users;"

# Check user_db (should match)
psql -U postgres -d user_db -c "SELECT email, role FROM users;"

# Check RabbitMQ queues
curl -u guest:guest http://localhost:15672/api/queues/%2F/user-service.user.created
```

### Test Clinician Dropdown

1. Login: http://localhost:3100
2. Navigate to: `/appointments/new`
3. Doctor dropdown should show 6 doctors

### Test Runtime User Creation

```bash
# Create a new user via API
curl -X POST http://localhost:3000/api/v1/auth/admin/users \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "email": "newdoctor@test.com",
    "firstName": "New",
    "lastName": "Doctor",
    "role": "doctor"
  }'

# Check it was synced to user-service
curl http://localhost:3000/api/v1/users?role=doctor | jq
```

## 📊 What Events Are Published

### user.created
Published when:
- User registers (`POST /auth/register`)
- Admin creates user (`POST /auth/admin/users`)
- Seed script creates users

Payload:
```json
{
  "eventId": "uuid",
  "eventType": "user.created",
  "timestamp": "2026-02-07T...",
  "source": "auth-service",
  "version": "1.0",
  "payload": {
    "userId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "doctor",
    "phoneNumber": "+263...",
    "isActive": true,
    "mustChangePassword": false,
    "createdAt": "2026-02-07T..."
  }
}
```

### user.activated / user.deactivated
Published when user status changes

### user.role.changed
Published when user role is updated

## 🐛 Troubleshooting

### Users Not Syncing

**Symptom**: Clinician dropdown still empty after seeding

**Diagnosis**:
```bash
# 1. Check if RabbitMQ is running
docker ps | grep rabbitmq
curl http://localhost:15672/

# 2. Check user-service logs for consumer connection
docker logs clinical_portal_user_service | grep RabbitMQ

# 3. Check if events are in the queue
curl -u guest:guest http://localhost:15672/api/queues/%2F/user-service.user.created
```

**Solutions**:

1. **RabbitMQ not running**:
   ```bash
   docker-compose up -d rabbitmq
   ```

2. **User-service not consuming**:
   ```bash
   # Restart user-service
   docker-compose restart user-service
   # Check logs
   docker logs -f user-service
   ```

3. **Events stuck in queue**:
   ```bash
   # User-service will process them when it connects
   # Check queue has messages:
   curl -u guest:guest http://localhost:15672/api/queues
   ```

4. **Events were published before user-service started**:
   ```bash
   # Events are persisted, just restart user-service
   docker-compose restart user-service
   ```

### Manual Fallback

If event-driven sync fails, you can still manually seed user-service:

```bash
cd apps/user-service
npm run seed
```

But this is a **workaround** - fix the event bus instead!

## ✅ Benefits of Event-Driven Approach

1. **Automatic Sync**: No manual seed scripts needed
2. **Runtime Consistency**: New users created at runtime automatically sync
3. **Decoupling**: Services don't need direct database access to each other
4. **Scalability**: Can add more consumers easily
5. **Resilience**: Events are persisted if consumer is down
6. **Audit Trail**: All changes are event-sourced

## 🎯 What Was Fixed

### Changes Made

1. **`apps/auth-service/src/auth/auth.service.ts`**
   - Added event publishing to `register()` method
   - Now publishes `user.created` event on user registration

2. **`apps/auth-service/src/database/seeds/run-seed.ts`**
   - Added RabbitMQ connection
   - Publishes `user.created` event for each seeded user
   - Seeds 10 users (1 admin, 6 doctors, 1 nurse, 1 pharmacist, 1 consultant)

3. **`apps/user-service/src/events/user-consumer.service.ts`**
   - Already had event consumer (no changes needed)
   - Automatically syncs users from events

### Removed

- ❌ `apps/user-service/src/database/seeds/run-seed.ts` - No longer needed!
- ❌ Manual user-service seeding from `seed-all.sh`

## 📚 Related Documentation

- **RabbitMQ Setup**: See `docker-compose.yml`
- **Event Schemas**: See `apps/auth-service/src/events/event-publisher.service.ts`
- **Consumer Implementation**: See `apps/user-service/src/events/user-consumer.service.ts`

## 🔮 Future Enhancements

1. **Dead Letter Queue**: Handle failed event processing
2. **Event Replay**: Ability to replay events for sync recovery
3. **Event Store**: Persist all events for audit/replay
4. **Saga Pattern**: Complex multi-service transactions
5. **Event Versioning**: Handle schema evolution

---

**Summary**: User synchronization now happens automatically via RabbitMQ events. Just seed auth-service and user-service syncs automatically! 🎉
