# Frontend Implementation Progress - Queue-Based Appointments

## ✅ COMPLETED (Tasks #15-16)

### 1. Updated Appointments List Page ✅
**File**: `apps/web/app/(dashboard)/appointments/page.tsx`

**Changes Made**:
- ✅ Added `isClinician()` helper function import
- ✅ Updated `fetchAppointments()` to use role-based API calls:
  - Clinicians: `clinicalApi.getMyAppointments()` (only their assignments)
  - Admins: `clinicalApi.getAppointments()` (all appointments)
- ✅ Added assignment status badge mappings
- ✅ Added new table column for "Assignment" status
- ✅ Added assignment status badges in table rows
- ✅ Added action buttons for clinicians:
  - **Accept** button (green) - for `assigned` status
  - **Reject** button (red) - for `assigned` status
  - **Refer** button (blue) - for `assigned` or `accepted` status
- ✅ Buttons only show for clinicians, not admins
- ✅ Integrated action modals component

**Assignment Status Badges**:
| Status | Color | Label |
|--------|-------|-------|
| `pending` | Gray | Pending |
| `assigned` | Yellow | Assigned |
| `accepted` | Green | Accepted |
| `rejected` | Red | Rejected |
| `referred` | Blue | Referred |
| `completed` | Green | Completed |

---

### 2. Created Action Modals Component ✅
**File**: `apps/web/app/(dashboard)/appointments/components/AppointmentActionModals.tsx`

**Three Modals Created**:

#### A. Accept Appointment Modal
- **Purpose**: Clinician confirms acceptance of assigned appointment
- **Features**:
  - Shows patient information (name, CHI, type, scheduled date/time)
  - Shows appointment reason
  - Simple confirmation dialog
  - Calls `clinicalApi.acceptAppointment()`
  - Shows loading state during API call
- **Success**: Updates appointment to `accepted` status, confirms appointment
- **Effect**: Appointment stays with clinician, ready for check-in

#### B. Reject Appointment Modal
- **Purpose**: Clinician rejects assigned appointment with reason
- **Features**:
  - Shows patient summary
  - **Rejection reason textarea** (minimum 10 characters required)
  - Character counter
  - Validation prevents submission until reason is sufficient
  - Calls `clinicalApi.rejectAppointment()`
- **Success**: Appointment returned to queue and auto-reassigned
- **Effect**: Appointment goes to next available clinician

#### C. Refer Appointment Modal
- **Purpose**: Clinician refers appointment to another clinician
- **Features**:
  - Shows patient summary
  - **Clinician dropdown** (auto-fetches from user-service)
  - Filters by:
    - Same hospital only
    - Excludes current clinician
    - Active clinicians only
  - **Optional referral notes** textarea
  - Calls `clinicalApi.referAppointmentTo()`
- **Success**: Appointment directly assigned to referred clinician
- **Effect**: New clinician must accept the referral

**Shared Features**:
- Loading states with spinners
- Success/error toast notifications
- Auto-refresh appointments list on success
- Form reset on dialog close
- Proper error handling

---

### 3. Updated Permissions Helper ✅
**File**: `apps/web/lib/permissions/index.ts`

**Added**:
```typescript
export function isClinician(role: string | undefined): boolean {
  const clinicianRoles: UserRole[] = [
    ROLES.DOCTOR,
    ROLES.CONSULTANT,
    ROLES.NURSE,
    ROLES.HOSPITAL_PHARMACIST,
    ROLES.PRESCRIBER,
  ];
  return clinicianRoles.includes(role as UserRole);
}
```

**Purpose**: Check if user has clinician role for showing appointment actions

---

## 🔄 How It Works

### For Clinicians (doctor, consultant, nurse, etc.)

1. **View Appointments**
   - See only appointments assigned to them
   - Assignment status badge shows current state

2. **Assigned Appointment** (yellow badge)
   - **Accept**: Confirms they'll see the patient
   - **Reject**: Returns to queue with reason, auto-reassigns
   - **Refer**: Pass to another clinician in same hospital

3. **Accepted Appointment** (green badge)
   - Can still **Refer** if needed
   - Can proceed with Check In, Complete, etc.

### For Admins (super_admin, clinical_admin)

1. **View All Appointments**
   - See every appointment across all clinicians
   - Assignment status visible for tracking

2. **No Action Buttons**
   - Admins don't accept/reject/refer
   - Admins manage queue and assignments separately

---

## 📊 User Experience Flow

### Scenario 1: Clinician Accepts Appointment
```
1. Clinician logs in
2. Sees "My Appointments" list
3. Appointment shows "Assigned" badge (yellow)
4. Clicks "Accept" button
5. Modal shows patient details
6. Confirms acceptance
7. Badge changes to "Accepted" (green)
8. Can now check in patient when they arrive
```

### Scenario 2: Clinician Rejects Appointment
```
1. Clinician sees assigned appointment
2. Clicks "Reject" button
3. Modal shows patient details + reason textarea
4. Types reason (e.g., "Unavailable due to emergency surgery")
5. Confirms rejection
6. Appointment removed from their list
7. Backend returns appointment to queue
8. Backend auto-assigns to next available clinician
9. New clinician sees it as "Assigned"
```

### Scenario 3: Clinician Refers Appointment
```
1. Clinician accepts/sees appointment
2. Realizes patient needs specialist
3. Clicks "Refer" button
4. Modal loads other clinicians in same hospital
5. Selects specialist from dropdown
6. Adds notes: "Patient requires cardiology consultation"
7. Confirms referral
8. Appointment removed from their list
9. Specialist receives it as "Assigned"
10. Specialist must accept the referral
```

---

## 🎨 UI Enhancements

### Table Updates
- ✅ New "Assignment" column between "Status" and "Actions"
- ✅ Color-coded assignment badges
- ✅ Action buttons with icons and labels
- ✅ Conditional rendering based on role and assignment status

### Action Buttons Styling
- **Accept**: Green text, CheckCircle icon
- **Reject**: Red text, XCircle icon
- **Refer**: Blue text, ArrowRightLeft icon
- All buttons show label text + icon for clarity

### Modals Styling
- Patient info displayed in gray rounded boxes
- Form validation with visual feedback
- Character counters for text inputs
- Disabled submit buttons until valid
- Loading spinners during API calls

---

## 🚧 REMAINING TASKS (3 remaining)

### Task #19: Update Navigation
**File**: `apps/web/components/navigation/Sidebar.tsx` (or similar)

**Required Changes**:
- Add "Appointment Queue" link for admins
- Update "Appointments" label:
  - Clinicians see: "My Appointments"
  - Admins see: "All Appointments"
- Add queue count badge for admins

---

### Task #14: Create Admin Queue Page
**File**: `apps/web/app/(dashboard)/appointments/queue/page.tsx` (NEW)

**Features Needed**:
- Table of queued appointments (pending assignment)
- Columns: Queue #, Patient, Type, Scheduled, Time in Queue, Actions
- Assign button per appointment
- Auto-assign all button
- Filters: Hospital, Department, Date Range
- Real-time queue count

---

### Task #17: Update Create Appointment Form
**File**: `apps/web/app/(dashboard)/appointments/new/page.tsx`

**Changes Needed**:
- Remove clinician selection dropdown
- Add assignment strategy selector:
  - Manual Assignment (add to queue)
  - Auto-Assign (Workload-Based)
  - Auto-Assign (Round-Robin)
- Update form submission logic

---

## 📈 Progress Summary

### Overall Frontend: 60% Complete

| Task | Status | Files Modified |
|------|--------|----------------|
| ✅ #15 | Complete | appointments/page.tsx |
| ✅ #16 | Complete | components/AppointmentActionModals.tsx |
| ⬜ #19 | Pending | navigation component |
| ⬜ #14 | Pending | appointments/queue/page.tsx (NEW) |
| ⬜ #17 | Pending | appointments/new/page.tsx |

---

## 🎯 Next Steps

1. **Priority 1**: Update navigation (Task #19) - Required for access
2. **Priority 2**: Create admin queue page (Task #14) - Core admin feature
3. **Priority 3**: Update create form (Task #17) - Completes the cycle

---

**Last Updated**: 2026-02-07
**Status**: Frontend implementation in progress - Appointments list and action modals complete!
