# Queue-Based Appointment System - Backend Implementation

## ✅ Completed Backend Changes

### 1. Database Schema Updates

**File**: `apps/clinical-service/src/appointments/entities/appointment.entity.ts`

**New Assignment Status Enum**:
```typescript
export type AssignmentStatus =
  | 'pending'     // Waiting for assignment
  | 'assigned'    // Assigned to clinician, awaiting acceptance
  | 'accepted'    // Clinician accepted
  | 'rejected'    // Clinician rejected
  | 'referred'    // Referred to another clinician
  | 'completed';  // Appointment completed
```

**New Fields Added**:
- `assignmentStatus`: Current assignment workflow state
- `queuePosition`: Position in the assignment queue
- `assignedAt`: Timestamp when clinician was assigned
- `acceptedAt`: Timestamp when clinician accepted
- `rejectedAt`: Timestamp when clinician rejected
- `rejectionReason`: Reason for rejection (min 10 chars)
- `referredToDoctorId`: ID of clinician referred to
- `referredToDoctorName`: Name of clinician referred to
- `referredAt`: Timestamp of referral
- `referralNotes`: Optional notes about the referral

**Database Indexes** (for performance):
- `['assignmentStatus', 'queuePosition']` - Fast queue queries
- `['doctorId', 'assignmentStatus']` - Fast clinician assignment queries
- `['hospitalId', 'assignmentStatus']` - Fast hospital-specific queries

**Modified Fields**:
- `doctorId`: Now nullable (appointments created without clinician)
- `doctorName`: Now nullable

---

### 2. Queue Management Service

**File**: `apps/clinical-service/src/appointments/services/queue.service.ts`

**Methods**:

1. **`addToQueue(appointmentId, hospitalId, departmentId?)`**
   - Adds appointment to queue with auto-incremented position
   - Sets `assignmentStatus` to 'pending'
   - Returns queue position number

2. **`getNextQueuePosition(hospitalId, departmentId?)`**
   - Calculates next available position in queue
   - Scoped by hospital and optionally department
   - Formula: `max(queuePosition) + 1`

3. **`getQueuedAppointments(hospitalId, departmentId?)`**
   - Returns all pending appointments in queue order
   - Ordered by `queuePosition ASC`
   - Filtered by hospital/department

4. **`removeFromQueue(appointmentId)`**
   - Removes appointment from queue after assignment
   - Triggers queue reordering

5. **`reorderQueue(hospitalId, departmentId?)`**
   - Recalculates sequential queue positions after removal
   - Ensures no gaps in position numbers

6. **`getQueueCount(hospitalId, departmentId?)`**
   - Returns count of pending appointments

---

### 3. Assignment Algorithm Service

**File**: `apps/clinical-service/src/appointments/services/assignment.service.ts`

**Assignment Strategies**:

#### Round-Robin Algorithm
- Gets last assigned clinician from database
- Rotates to next clinician in the list
- Ensures even distribution across all clinicians
- Falls back to first clinician if no previous assignments

#### Workload-Based Algorithm
- Counts active appointments per clinician
- Active = status IN ('assigned', 'accepted')
- Optionally filters by scheduled date
- Assigns to clinician with fewest appointments

**Methods**:

1. **`autoAssignClinician(appointmentId, strategy)`**
   - Main entry point for auto-assignment
   - Strategies: 'round-robin' | 'workload'
   - Returns: `{ clinicianId, clinicianName }`

2. **`getAvailableClinicians(hospitalId, departmentId?)`**
   - Fetches active clinicians from user-service
   - Roles: doctor, consultant, nurse, hospital_pharmacist, prescriber
   - Filters by: `isActive: true, hospitalId, departmentId`

3. **`getClinicianName(clinicianId)`**
   - Helper to fetch clinician full name from user-service

4. **`isClinicianActive(clinicianId)`**
   - Verifies clinician is still active

---

### 4. Updated Appointments Service

**File**: `apps/clinical-service/src/appointments/appointments.service.ts`

**Modified `create()` Method**:
```typescript
async create(dto, userId) {
  // 1. Create appointment with PENDING status (no clinician)
  const appointment = create({
    ...dto,
    doctorId: null,
    doctorName: null,
    assignmentStatus: 'pending',
  });

  // 2. Add to queue
  const queuePosition = await queueService.addToQueue(...);

  // 3. If autoAssign enabled, assign immediately
  if (dto.autoAssign) {
    const strategy = dto.assignmentStrategy || 'workload';
    const assigned = await assignmentService.autoAssignClinician(...);
    if (assigned) {
      await assignClinician(appointmentId, assigned.clinicianId, userId);
    }
  }

  return appointment;
}
```

**New Methods**:

1. **`assignClinician(appointmentId, clinicianId, adminId)`** (Admin Only)
   - Manually assigns clinician to appointment
   - Sets `assignmentStatus` to 'assigned'
   - Removes from queue
   - Publishes audit log

2. **`acceptAppointment(appointmentId, clinicianId)`** (Clinician Only)
   - Clinician accepts assigned appointment
   - Verifies clinician is assigned to this appointment
   - Sets `assignmentStatus` to 'accepted'
   - Sets `status` to 'confirmed'
   - Publishes audit log

3. **`rejectAppointment(appointmentId, clinicianId, reason)`** (Clinician Only)
   - Clinician rejects assigned appointment
   - Requires rejection reason (min 10 characters)
   - Clears assignment (sets doctorId/doctorName to null)
   - Returns appointment to queue
   - Auto-reassigns using workload strategy
   - Publishes audit log

4. **`referAppointment(appointmentId, clinicianId, referToClinicianId, notes?)`** (Clinician Only)
   - Clinician refers appointment to another clinician
   - Stores referral information (referredById, referredAt, referralNotes)
   - Updates assignment to referred clinician
   - Sets `assignmentStatus` to 'assigned' (new clinician must accept)
   - Bypasses queue (direct assignment)
   - Publishes audit log

5. **`getMyAppointments(clinicianId, filters?)`** (Clinician Only)
   - Returns appointments assigned to specific clinician
   - Only shows appointments with status IN ('assigned', 'accepted')
   - Supports filters: status, dateFrom, dateTo, appointmentType
   - Ordered by scheduledDate ASC

---

### 5. Updated Appointments Controller

**File**: `apps/clinical-service/src/appointments/appointments.controller.ts`

**Role-Based Endpoints**:

#### Admin-Only Endpoints
```typescript
@Post() // Create appointment
@Roles(...ADMIN_ROLES) // super_admin, clinical_admin

@Get('queue') // Get queued appointments
@Roles(...ADMIN_ROLES)

@Post(':id/assign') // Manually assign clinician
@Roles(...ADMIN_ROLES)

@Get() // Get all appointments (unrestricted view)
@Roles(...ADMIN_ROLES)
```

#### Clinician-Only Endpoints
```typescript
@Get('my-appointments') // Get my assigned appointments
@Roles(...CLINICIAN_ROLES) // doctor, consultant, nurse, etc.

@Post(':id/accept') // Accept appointment
@Roles(...CLINICIAN_ROLES)

@Post(':id/reject') // Reject appointment
@Roles(...CLINICIAN_ROLES)

@Post(':id/refer') // Refer to another clinician
@Roles(...CLINICIAN_ROLES)
```

**New DTOs**:
- `AssignClinicianDto`: `{ clinicianId: string }`
- `RejectAppointmentDto`: `{ reason: string }` (min 10 chars)
- `ReferAppointmentDto`: `{ referToClinicianId: string, notes?: string }`

---

### 6. API Gateway Updates

**File**: `apps/api-gateway/src/clinical/clinical.controller.ts`

**New Proxied Endpoints**:
```typescript
GET  /api/v1/appointments/queue
GET  /api/v1/appointments/my-appointments
POST /api/v1/appointments/:id/assign
POST /api/v1/appointments/:id/accept
POST /api/v1/appointments/:id/reject
```

**File**: `apps/api-gateway/src/clinical/clinical.service.ts`

**New Proxy Methods**:
- `getAppointmentQueue(query, authHeader)`
- `getMyAppointments(query, authHeader)`
- `assignClinician(id, dto, authHeader)`
- `acceptAppointment(id, authHeader)`
- `rejectAppointment(id, dto, authHeader)`

---

### 7. Module Updates

**File**: `apps/clinical-service/src/appointments/appointments.module.ts`

**Added Providers**:
```typescript
providers: [
  AppointmentsService,
  QueueService,          // NEW
  AssignmentService,     // NEW
],
```

---

## 🔄 Appointment Workflow

### 1. Create Appointment (Admin)
```
Admin → POST /appointments
  ↓
AppointmentsService.create()
  ↓
Appointment created with status='pending'
  ↓
QueueService.addToQueue() → queuePosition assigned
  ↓
[Optional] Auto-assign:
  - AssignmentService.autoAssignClinician()
  - Round-robin OR workload-based strategy
  - AppointmentsService.assignClinician()
  - Remove from queue
  - assignmentStatus='assigned'
```

### 2. Clinician Accepts Appointment
```
Clinician → POST /appointments/:id/accept
  ↓
AppointmentsService.acceptAppointment()
  ↓
Verify clinician is assigned
  ↓
assignmentStatus='accepted'
status='confirmed'
  ↓
Audit log published
```

### 3. Clinician Rejects Appointment
```
Clinician → POST /appointments/:id/reject
  ↓
AppointmentsService.rejectAppointment()
  ↓
assignmentStatus='rejected'
doctorId/doctorName cleared
  ↓
QueueService.addToQueue() → back to queue
  ↓
AssignmentService.autoAssignClinician() → auto-reassign
  ↓
AppointmentsService.assignClinician() → assign to next clinician
```

### 4. Clinician Refers Appointment
```
Clinician → POST /appointments/:id/refer
  ↓
AppointmentsService.referAppointment()
  ↓
Store referral info (referredById, referredToDoctorId, referralNotes)
  ↓
Update assignment to new clinician
assignmentStatus='assigned' (new clinician must accept)
  ↓
Audit log published
```

---

## 🔒 Security & Authorization

### Role Definitions
- **Admin Roles**: `super_admin`, `clinical_admin`
- **Clinician Roles**: `doctor`, `consultant`, `nurse`, `hospital_pharmacist`, `prescriber`

### Access Control
- ✅ Only admins can create appointments
- ✅ Only admins can view the queue
- ✅ Only admins can manually assign clinicians
- ✅ Only admins can view all appointments (unrestricted)
- ✅ Clinicians can only view their assigned appointments
- ✅ Clinicians can only accept/reject/refer appointments assigned to them
- ✅ Clinician ownership verified before accept/reject/refer operations

---

## 📊 Database Indexes for Performance

1. **Queue Queries**: `(assignmentStatus, queuePosition)`
   - Fast retrieval of queued appointments in order

2. **Clinician Queries**: `(doctorId, assignmentStatus)`
   - Fast "my appointments" queries for clinicians

3. **Hospital Queries**: `(hospitalId, assignmentStatus)`
   - Fast hospital-specific queue and assignment queries

---

## 🎯 Key Features

1. **Queue Management**
   - Automatic queue positioning
   - Queue reordering after removal
   - Hospital/department scoped queues

2. **Smart Assignment**
   - Round-robin: Even distribution across clinicians
   - Workload-based: Assigns to least busy clinician
   - Integration with user-service for active clinicians

3. **Accept/Reject Workflow**
   - Clinicians must explicitly accept appointments
   - Rejected appointments auto-reassign
   - Rejection requires detailed reason

4. **Referral System**
   - Direct referral between clinicians
   - Bypasses queue
   - Tracks referral chain (referredById)

5. **Audit Trail**
   - All assignment actions logged
   - Tracks: assign, accept, reject, refer
   - Includes user ID and details

---

## 🚀 Next Steps (Frontend)

1. Create admin queue view page
2. Update appointments list page with role-based views
3. Create accept/reject/refer action modals
4. Update create appointment form
5. Update appointments API client
6. Update navigation for queue access

---

## ✅ Backend Status: COMPLETE

All backend services, controllers, and database schemas have been implemented and are ready for frontend integration.
