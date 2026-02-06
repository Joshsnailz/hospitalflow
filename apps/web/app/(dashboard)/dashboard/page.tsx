'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  Pill,
  FileText,
  UserPlus,
  ClipboardList,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Heart,
  ShieldCheck,
  Building2,
  RefreshCw,
  AlertTriangle,
  Package,
  Syringe,
  MonitorCheck,
  ClipboardCheck,
  ListChecks,
  BedDouble,
  Ambulance,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ROLES } from '@/lib/permissions';
import { clinicalApi } from '@/lib/api/clinical';
import { hospitalsApi } from '@/lib/api/hospitals';
import type {
  DashboardStats,
  DashboardActivity,
  AppointmentDashboardStats,
  EncounterDashboardStats,
  EmergencyDashboardStats,
  DischargeDashboardStats,
  HospitalDashboardStats,
} from '@/lib/types/clinical';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AppointmentsTable } from '@/components/dashboard/AppointmentsTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickActionConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'default';
}

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  loading?: boolean;
}

interface ExtendedDashboardData {
  base: DashboardStats | null;
  appointments: AppointmentDashboardStats | null;
  encounters: EncounterDashboardStats | null;
  emergency: EmergencyDashboardStats | null;
  discharge: DischargeDashboardStats | null;
  hospital: HospitalDashboardStats | null;
}

// ---------------------------------------------------------------------------
// Skeleton card for loading state
// ---------------------------------------------------------------------------

function SkeletonStatCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Enhanced stat card with color support
// ---------------------------------------------------------------------------

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    ring: 'ring-blue-100',
  },
  green: {
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    ring: 'ring-emerald-100',
  },
  amber: {
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    ring: 'ring-amber-100',
  },
  red: {
    bg: 'bg-red-50',
    iconColor: 'text-red-600',
    ring: 'ring-red-100',
  },
  slate: {
    bg: 'bg-slate-50',
    iconColor: 'text-slate-600',
    ring: 'ring-slate-100',
  },
};

function EnhancedStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  loading = false,
}: EnhancedStatCardProps) {
  if (loading) return <SkeletonStatCard />;

  const colors = colorMap[color];

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${colors.bg} ring-1 ${colors.ring}`}
          >
            <Icon className={`h-5 w-5 ${colors.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Ward occupancy bar
// ---------------------------------------------------------------------------

function WardOccupancyBar({
  name,
  occupied,
  total,
}: {
  name: string;
  occupied: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const barColor =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const badgeVariant =
    pct >= 90 ? 'destructive' : pct >= 70 ? 'warning' : 'secondary';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate mr-2">{name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-muted-foreground text-xs">
            {occupied}/{total} beds
          </span>
          <Badge variant={badgeVariant as any} className="text-xs tabular-nums">
            {pct}%
          </Badge>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers (preserved from existing code)
// ---------------------------------------------------------------------------

function getActivityIcon(type: string): LucideIcon {
  switch (type) {
    case 'appointment_completed':
    case 'completed':
      return CheckCircle;
    case 'patient_registered':
    case 'new_patient':
      return UserPlus;
    case 'prescription':
    case 'prescription_approved':
      return Pill;
    case 'lab_result':
    case 'pending':
      return Clock;
    case 'critical':
    case 'alert':
    case 'emergency':
      return AlertCircle;
    case 'encounter':
      return Stethoscope;
    case 'discharge':
      return FileText;
    case 'care_plan':
      return ClipboardList;
    default:
      return Activity;
  }
}

function getActivityType(type: string): 'success' | 'default' | 'warning' | 'danger' {
  switch (type) {
    case 'appointment_completed':
    case 'completed':
    case 'prescription_approved':
      return 'success';
    case 'lab_result':
    case 'pending':
      return 'warning';
    case 'critical':
    case 'alert':
    case 'emergency':
      return 'danger';
    default:
      return 'default';
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getQuickActionsForRole(role: string | undefined): QuickActionConfig[] {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.CLINICAL_ADMIN:
      return [
        { label: 'Manage Users', href: '/users', icon: Users, color: 'primary' },
        { label: 'Hospitals', href: '/hospitals', icon: Building2, color: 'success' },
        { label: 'Audit Trails', href: '/audit-trails', icon: ShieldCheck, color: 'warning' },
        { label: 'Settings', href: '/settings', icon: MonitorCheck, color: 'default' },
      ];

    case ROLES.DOCTOR:
    case ROLES.CONSULTANT:
      return [
        { label: 'New Patient', href: '/patients/new', icon: UserPlus, color: 'primary' },
        { label: 'Schedule', href: '/appointments/new', icon: Calendar, color: 'success' },
        { label: 'Prescribe', href: '/prescriptions/new', icon: ClipboardList, color: 'warning' },
        { label: 'Imaging', href: '/imaging', icon: MonitorCheck, color: 'default' },
      ];

    case ROLES.NURSE:
      return [
        { label: 'Record Vitals', href: '/patients', icon: Heart, color: 'primary' },
        { label: 'Care Plans', href: '/care-plans', icon: ClipboardList, color: 'success' },
        { label: 'Emergency', href: '/emergency', icon: AlertCircle, color: 'warning' },
        { label: 'Discharge', href: '/discharge', icon: FileText, color: 'default' },
      ];

    case ROLES.HOSPITAL_PHARMACIST:
      return [
        { label: 'Review Rx', href: '/prescriptions', icon: ClipboardCheck, color: 'primary' },
        { label: 'CD Register', href: '/controlled-drugs', icon: ShieldCheck, color: 'success' },
        { label: 'Discharge Rx', href: '/pharmacy-discharge', icon: FileText, color: 'warning' },
        { label: 'Patients', href: '/patients', icon: Users, color: 'default' },
      ];

    case ROLES.PRESCRIBER:
      return [
        { label: 'New Prescription', href: '/prescriptions/new', icon: Pill, color: 'primary' },
        { label: 'CD Register', href: '/controlled-drugs', icon: ShieldCheck, color: 'success' },
        { label: 'Patients', href: '/patients', icon: Users, color: 'warning' },
        { label: 'Appointments', href: '/appointments', icon: Calendar, color: 'default' },
      ];

    case ROLES.PHARMACY_TECHNICIAN:
    case ROLES.PHARMACY_SUPPORT_WORKER:
    case ROLES.PHARMACY_SUPPORT_MANAGER:
      return [
        { label: 'Dispensing', href: '/pharmacy-discharge', icon: Package, color: 'primary' },
        { label: 'Stock Check', href: '/inventory', icon: ListChecks, color: 'success' },
        { label: 'Patients', href: '/patients', icon: Users, color: 'warning' },
        { label: 'Helpdesk', href: '/helpdesk', icon: Syringe, color: 'default' },
      ];

    default:
      return [
        { label: 'New Patient', href: '/patients/new', icon: UserPlus, color: 'primary' },
        { label: 'Schedule', href: '/appointments/new', icon: Calendar, color: 'success' },
        { label: 'Prescribe', href: '/prescriptions/new', icon: ClipboardList, color: 'warning' },
        { label: 'Consult', href: '/consultations/new', icon: Stethoscope, color: 'default' },
      ];
  }
}

function mapActivities(activities: DashboardActivity[]) {
  return activities.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    time: formatTimestamp(a.timestamp),
    icon: getActivityIcon(a.type),
    type: getActivityType(a.type),
  }));
}

function mapAppointments(stats: DashboardStats) {
  return stats.upcomingAppointments.map((apt) => ({
    id: apt.id,
    patient: { name: apt.patientName ?? `Patient ${apt.patientId}` },
    time: apt.scheduledTime,
    type: apt.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    status: (apt.status === 'confirmed' || apt.status === 'scheduled'
      ? 'confirmed'
      : apt.status === 'completed'
        ? 'completed'
        : apt.status === 'cancelled'
          ? 'cancelled'
          : 'pending') as 'confirmed' | 'pending' | 'cancelled' | 'completed',
  }));
}

// Safe accessor -- returns 0 when source data failed to load
function safe(val: number | undefined | null): number {
  return val ?? 0;
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<ExtendedDashboardData>({
    base: null,
    appointments: null,
    encounters: null,
    emergency: null,
    discharge: null,
    hospital: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [baseError, setBaseError] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Data fetching -- all endpoints in parallel via Promise.allSettled
  // -----------------------------------------------------------------------
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setBaseError(null);

    const [baseResult, apptResult, encResult, emergResult, dischargeResult, hospitalResult] =
      await Promise.allSettled([
        clinicalApi.getDashboardStats({ role: user?.role }),
        clinicalApi.getAppointmentDashboardStats(),
        clinicalApi.getEncounterDashboardStats(),
        clinicalApi.getEmergencyDashboardStats(),
        clinicalApi.getDischargeDashboardStats(),
        hospitalsApi.getDashboardStats(),
      ]);

    // Base stats are critical
    if (baseResult.status === 'fulfilled' && baseResult.value?.success && baseResult.value.data) {
      setData((prev) => ({ ...prev, base: baseResult.value.data }));
    } else {
      const errMsg =
        baseResult.status === 'rejected'
          ? baseResult.reason?.response?.data?.message ||
            baseResult.reason?.message ||
            'Failed to load dashboard data.'
          : 'Failed to load dashboard data.';
      setBaseError(errMsg);
    }

    // Secondary stats -- graceful degradation
    if (apptResult.status === 'fulfilled' && apptResult.value?.success) {
      setData((prev) => ({ ...prev, appointments: apptResult.value.data }));
    }
    if (encResult.status === 'fulfilled' && encResult.value?.success) {
      setData((prev) => ({ ...prev, encounters: encResult.value.data }));
    }
    if (emergResult.status === 'fulfilled' && emergResult.value?.success) {
      setData((prev) => ({ ...prev, emergency: emergResult.value.data }));
    }
    if (dischargeResult.status === 'fulfilled' && dischargeResult.value?.success) {
      setData((prev) => ({ ...prev, discharge: dischargeResult.value.data }));
    }
    if (hospitalResult.status === 'fulfilled' && hospitalResult.value?.success) {
      setData((prev) => ({ ...prev, hospital: hospitalResult.value.data }));
    }

    setIsLoading(false);
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton welcome banner */}
        <div className="rounded-xl bg-slate-100 p-6 animate-pulse h-32" />

        {/* Skeleton stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={`skel-row1-${i}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={`skel-row2-${i}`} />
          ))}
        </div>

        {/* Skeleton content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Error state (only when base stats fail)
  // -----------------------------------------------------------------------
  if (baseError || !data.base) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Unable to load dashboard</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {baseError || 'No data was returned from the server.'}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const dashboardStats = data.base;
  const apptStats = data.appointments;
  const encStats = data.encounters;
  const emergStats = data.emergency;
  const dischStats = data.discharge;
  const hospStats = data.hospital;

  const quickActions = getQuickActionsForRole(user?.role);
  const activities = mapActivities(dashboardStats.recentActivities);
  const appointments = mapAppointments(dashboardStats);

  const pendingTasks =
    dashboardStats.pendingImagingRequests +
    dashboardStats.activeDischargeForms +
    dashboardStats.emergencyVisits;

  const role = user?.role;

  // -----------------------------------------------------------------------
  // Role-specific sections
  // -----------------------------------------------------------------------

  const isAdmin = role === ROLES.SUPER_ADMIN || role === ROLES.CLINICAL_ADMIN;
  const isDoctor = role === ROLES.DOCTOR || role === ROLES.CONSULTANT;
  const isNurse = role === ROLES.NURSE;
  const isPharmacist =
    role === ROLES.HOSPITAL_PHARMACIST ||
    role === ROLES.PHARMACY_TECHNICIAN ||
    role === ROLES.PHARMACY_SUPPORT_MANAGER ||
    role === ROLES.PHARMACY_SUPPORT_WORKER;

  // Build ward occupancy data for admin from hospital stats
  const wardOccupancyEntries = hospStats?.byWard
    ? Object.entries(hospStats.byWard).map(([name, info]) => ({
        name,
        occupied: info.occupied,
        total: info.total,
      }))
    : [];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        userName={user?.firstName}
        appointmentsToday={dashboardStats.todayAppointments}
        pendingTasks={pendingTasks}
      />

      {/* ================================================================= */}
      {/* ADMIN / CLINICAL ADMIN DASHBOARD                                  */}
      {/* ================================================================= */}
      {isAdmin && (
        <>
          {/* Row 1: 4 primary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              title="Total Registered Patients"
              value={dashboardStats.totalPatients.toLocaleString()}
              subtitle={`${safe(dashboardStats.monthlyPatientsSeen)} seen this month`}
              icon={Users}
              color="blue"
            />
            <EnhancedStatCard
              title="Scheduled Today"
              value={dashboardStats.todayAppointments.toLocaleString()}
              subtitle={`${safe(apptStats?.checkedIn)} checked in`}
              icon={Calendar}
              color="green"
            />
            <EnhancedStatCard
              title="Currently Admitted"
              value={safe(encStats?.admitted).toLocaleString()}
              subtitle={`${safe(encStats?.inTreatment)} in treatment`}
              icon={BedDouble}
              color="amber"
            />
            <EnhancedStatCard
              title="Beds Available"
              value={safe(hospStats?.availableBeds ?? dashboardStats.bedAvailability).toLocaleString()}
              subtitle={`${safe(hospStats?.occupancyRate ?? dashboardStats.wardOccupancy)}% occupancy`}
              icon={Building2}
              color="slate"
            />
          </div>

          {/* Row 2: 4 secondary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              title="Emergency Waiting"
              value={safe(emergStats?.totalActive ?? dashboardStats.emergencyVisits).toLocaleString()}
              subtitle={`${safe(emergStats?.awaitingBed)} awaiting bed`}
              icon={Ambulance}
              color="red"
            />
            <EnhancedStatCard
              title="Discharges Pending"
              value={safe(dischStats?.pendingReview ?? dashboardStats.activeDischargeForms).toLocaleString()}
              subtitle={`${safe(dischStats?.completedToday)} completed today`}
              icon={ClipboardCheck}
              color="amber"
            />
            <EnhancedStatCard
              title="Appointments Completed Today"
              value={safe(apptStats?.completed).toLocaleString()}
              subtitle={`of ${dashboardStats.todayAppointments.toLocaleString()} total`}
              icon={CheckCircle}
              color="green"
            />
            <EnhancedStatCard
              title="No-Shows Today"
              value={safe(apptStats?.noShows).toLocaleString()}
              subtitle={safe(apptStats?.cancelled) > 0 ? `${safe(apptStats?.cancelled)} cancelled` : 'none cancelled'}
              icon={AlertTriangle}
              color={safe(apptStats?.noShows) > 0 ? 'red' : 'slate'}
            />
          </div>

          {/* Row 3: Ward Occupancy Overview */}
          {wardOccupancyEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Ward Occupancy Overview</CardTitle>
                    <CardDescription className="mt-1">
                      {safe(hospStats?.occupiedBeds)} of {safe(hospStats?.totalBeds)} beds occupied
                      ({safe(hospStats?.maintenanceBeds)} in maintenance)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {safe(hospStats?.occupancyRate)}% overall
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {wardOccupancyEntries.map((ward) => (
                    <WardOccupancyBar
                      key={ward.name}
                      name={ward.name}
                      occupied={ward.occupied}
                      total={ward.total}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Row 4: Existing activity feed + appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AppointmentsTable
                appointments={appointments}
                onViewAll={() => router.push('/appointments')}
              />
            </div>
            <div>
              <QuickActions actions={quickActions} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed activities={activities} maxHeight="320px" />
            </div>

            <div className="space-y-4">
              <MonthlyOverviewCard stats={dashboardStats} />
              <HelpCard onNavigate={() => router.push('/helpdesk')} />
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* DOCTOR / CONSULTANT DASHBOARD                                     */}
      {/* ================================================================= */}
      {isDoctor && (
        <>
          {/* Row 1: 4 primary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              title="My Appointments Today"
              value={dashboardStats.todayAppointments.toLocaleString()}
              subtitle={`${dashboardStats.upcomingAppointments.length} upcoming`}
              icon={Calendar}
              color="blue"
            />
            <EnhancedStatCard
              title="Patients In Progress"
              value={safe(apptStats?.checkedIn).toLocaleString()}
              subtitle={safe(encStats?.inTreatment) > 0 ? `${safe(encStats?.inTreatment)} in treatment` : 'none in treatment'}
              icon={Users}
              color="green"
            />
            <EnhancedStatCard
              title="Active Encounters"
              value={dashboardStats.activeEncounters.toLocaleString()}
              subtitle={`${safe(encStats?.awaitingDischarge)} awaiting discharge`}
              icon={Stethoscope}
              color="amber"
            />
            <EnhancedStatCard
              title="Pending Discharges"
              value={dashboardStats.activeDischargeForms.toLocaleString()}
              subtitle={safe(dischStats?.pendingPharmacyReview) > 0 ? `${safe(dischStats?.pendingPharmacyReview)} pharmacy pending` : 'none pending pharmacy'}
              icon={FileText}
              color="red"
            />
          </div>

          {/* Row 2: 4 secondary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              title="Completed Today"
              value={safe(apptStats?.completed).toLocaleString()}
              subtitle={safe(dashboardStats.monthlyPatientsSeen) > 0 ? `${safe(dashboardStats.monthlyPatientsSeen)} this month` : 'none this month'}
              icon={CheckCircle}
              color="green"
            />
            <EnhancedStatCard
              title="Upcoming This Week"
              value={safe(apptStats?.upcoming).toLocaleString()}
              subtitle={`${safe(dashboardStats.monthlyAppointments)} this month`}
              icon={TrendingUp}
              color="blue"
            />
            <EnhancedStatCard
              title="Emergency Visits Today"
              value={safe(emergStats?.totalActive ?? dashboardStats.emergencyVisits).toLocaleString()}
              subtitle={safe(emergStats?.inTreatment) > 0 ? `${safe(emergStats?.inTreatment)} in treatment` : 'none active'}
              icon={Ambulance}
              color={safe(emergStats?.totalActive ?? dashboardStats.emergencyVisits) > 0 ? 'red' : 'slate'}
            />
            <EnhancedStatCard
              title="Notes Written Today"
              value={safe(dashboardStats.monthlyPatientsSeen).toLocaleString()}
              subtitle="clinical notes"
              icon={ClipboardList}
              color="slate"
            />
          </div>

          {/* Row 3: Today's Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AppointmentsTable
                appointments={appointments}
                title="Today's Schedule"
                onViewAll={() => router.push('/appointments')}
              />
            </div>
            <div>
              <QuickActions actions={quickActions} />
            </div>
          </div>

          {/* Row 4: Activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed activities={activities} maxHeight="320px" />
            </div>
            <div className="space-y-4">
              <MonthlyOverviewCard stats={dashboardStats} />
              <HelpCard onNavigate={() => router.push('/helpdesk')} />
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* NURSE DASHBOARD                                                   */}
      {/* ================================================================= */}
      {isNurse && (
        <>
          {/* Row 1: 4 primary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              title="Patients in Ward"
              value={safe(encStats?.admitted).toLocaleString()}
              subtitle={`${safe(encStats?.inTreatment)} in treatment`}
              icon={Users}
              color="blue"
            />
            <EnhancedStatCard
              title="Admissions Today"
              value={dashboardStats.todayAppointments.toLocaleString()}
              subtitle={`${dashboardStats.totalPatients} total assigned`}
              icon={UserPlus}
              color="green"
            />
            <EnhancedStatCard
              title="Discharges Today"
              value={safe(dischStats?.completedToday).toLocaleString()}
              subtitle={`${safe(dischStats?.pendingReview ?? dashboardStats.activeDischargeForms)} pending review`}
              icon={FileText}
              color="amber"
            />
            <EnhancedStatCard
              title="Beds Available"
              value={safe(hospStats?.availableBeds ?? dashboardStats.bedAvailability).toLocaleString()}
              subtitle={`${safe(hospStats?.occupancyRate ?? dashboardStats.wardOccupancy)}% occupancy`}
              icon={BedDouble}
              color="slate"
            />
          </div>

          {/* Row 2: 4 secondary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              title="Emergency Alerts"
              value={safe(emergStats?.totalActive ?? dashboardStats.emergencyVisits).toLocaleString()}
              subtitle={safe(emergStats?.totalActive ?? dashboardStats.emergencyVisits) > 0 ? 'action required' : 'none active'}
              icon={AlertCircle}
              color={safe(emergStats?.totalActive ?? dashboardStats.emergencyVisits) > 0 ? 'red' : 'green'}
            />
            <EnhancedStatCard
              title="Assessments Pending"
              value={dashboardStats.pendingImagingRequests.toLocaleString()}
              subtitle={dashboardStats.pendingImagingRequests > 0 ? 'needs review' : 'all clear'}
              icon={ClipboardCheck}
              color={dashboardStats.pendingImagingRequests > 0 ? 'amber' : 'green'}
            />
            <EnhancedStatCard
              title="Care Plans Active"
              value={dashboardStats.activeCarePlans.toLocaleString()}
              subtitle={`${dashboardStats.activeDischargeForms} discharges pending`}
              icon={ClipboardList}
              color="blue"
            />
            <EnhancedStatCard
              title="Vitals Due"
              value={dashboardStats.activeEncounters.toLocaleString()}
              subtitle={dashboardStats.activeEncounters > 5 ? 'high workload' : 'on track'}
              icon={Heart}
              color={dashboardStats.activeEncounters > 5 ? 'amber' : 'green'}
            />
          </div>

          {/* Row 3: Existing activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed activities={activities} maxHeight="320px" />
            </div>
            <div className="space-y-4">
              <QuickActions actions={quickActions} />
              <HelpCard onNavigate={() => router.push('/helpdesk')} />
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* PHARMACIST DASHBOARD                                              */}
      {/* ================================================================= */}
      {isPharmacist && (
        <>
          {/* Row 1: 4 primary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              title="Prescriptions to Review"
              value={safe(dashboardStats.monthlyPrescriptions).toLocaleString()}
              subtitle={`${dashboardStats.todayAppointments} new today`}
              icon={ClipboardCheck}
              color="blue"
            />
            <EnhancedStatCard
              title="Discharge Pharmacy Pending"
              value={safe(dischStats?.pendingPharmacyReview ?? dashboardStats.pharmacyDischargesPending).toLocaleString()}
              subtitle={`${dashboardStats.activeDischargeForms} active forms`}
              icon={FileText}
              color={safe(dischStats?.pendingPharmacyReview ?? dashboardStats.pharmacyDischargesPending) > 0 ? 'red' : 'green'}
            />
            <EnhancedStatCard
              title="Controlled Drug Entries Today"
              value={safe(dashboardStats.controlledDrugEntries).toLocaleString()}
              subtitle="requires witness"
              icon={ShieldCheck}
              color={safe(dashboardStats.controlledDrugEntries) > 0 ? 'amber' : 'green'}
            />
            <EnhancedStatCard
              title="Active Encounters"
              value={dashboardStats.activeEncounters.toLocaleString()}
              subtitle={`${dashboardStats.totalPatients} patients`}
              icon={Activity}
              color="slate"
            />
          </div>

          {/* Row 2: Discharge forms needing pharmacy review */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Discharge Forms Needing Pharmacy Review
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {safe(dischStats?.pendingPharmacyReview ?? dashboardStats.pharmacyDischargesPending)} forms
                    awaiting pharmacy sign-off
                  </CardDescription>
                </div>
                <button
                  onClick={() => router.push('/pharmacy-discharge')}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View all
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {dashboardStats.upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.upcomingAppointments.slice(0, 5).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 ring-1 ring-amber-100">
                          <FileText className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {apt.patientName ?? `Patient ${apt.patientId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            {' '}&middot;{' '}{apt.scheduledTime}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={apt.status === 'confirmed' || apt.status === 'scheduled' ? 'outline' : 'secondary'}
                        className="shrink-0 text-xs"
                      >
                        {apt.status === 'confirmed' || apt.status === 'scheduled' ? 'Pending Review' : apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No discharge forms currently awaiting pharmacy review.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity feed + quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed activities={activities} maxHeight="320px" />
            </div>
            <div className="space-y-4">
              <QuickActions actions={quickActions} />
              <HelpCard onNavigate={() => router.push('/helpdesk')} />
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* DEFAULT / OTHER ROLES (Prescriber, etc.)                          */}
      {/* ================================================================= */}
      {!isAdmin && !isDoctor && !isNurse && !isPharmacist && (
        <>
          {/* Fallback: use original stat card pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              title="Total Patients"
              value={dashboardStats.totalPatients.toLocaleString()}
              subtitle={`${dashboardStats.todayAppointments} today`}
              icon={Users}
              color="blue"
            />
            <EnhancedStatCard
              title="Today's Appointments"
              value={dashboardStats.todayAppointments.toLocaleString()}
              subtitle={`${dashboardStats.upcomingAppointments.length} upcoming`}
              icon={Calendar}
              color="green"
            />
            <EnhancedStatCard
              title="Active Encounters"
              value={dashboardStats.activeEncounters.toLocaleString()}
              subtitle={`${dashboardStats.emergencyVisits} emergency`}
              icon={Stethoscope}
              color={dashboardStats.emergencyVisits > 0 ? 'amber' : 'green'}
            />
            <EnhancedStatCard
              title="Care Plans"
              value={dashboardStats.activeCarePlans.toLocaleString()}
              subtitle={`${dashboardStats.activeDischargeForms} discharges`}
              icon={ClipboardList}
              color="slate"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AppointmentsTable
                appointments={appointments}
                onViewAll={() => router.push('/appointments')}
              />
            </div>
            <div>
              <QuickActions actions={quickActions} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed activities={activities} maxHeight="320px" />
            </div>
            <div className="space-y-4">
              <MonthlyOverviewCard stats={dashboardStats} />
              <HelpCard onNavigate={() => router.push('/helpdesk')} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monthly Overview Card (extracted for reuse across roles)
// ---------------------------------------------------------------------------

function MonthlyOverviewCard({ stats }: { stats: DashboardStats }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Monthly Overview</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Patients Seen</span>
          <span className="text-sm font-medium">
            {safe(stats.monthlyPatientsSeen).toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                stats.totalPatients > 0
                  ? Math.round((safe(stats.monthlyPatientsSeen) / stats.totalPatients) * 100)
                  : 0
              )}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">Appointments</span>
          <span className="text-sm font-medium">
            {safe(stats.monthlyAppointments).toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                stats.monthlyAppointments
                  ? Math.round(
                      (stats.todayAppointments / (stats.monthlyAppointments || 1)) * 100 * 30
                    )
                  : 0
              )}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">Prescriptions</span>
          <span className="text-sm font-medium">
            {safe(stats.monthlyPrescriptions).toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                stats.monthlyPrescriptions
                  ? Math.round(
                      (safe(stats.monthlyPrescriptions) /
                        Math.max(safe(stats.monthlyPrescriptions), 1)) *
                        60
                    )
                  : 0
              )}%`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Help card (extracted for reuse)
// ---------------------------------------------------------------------------

function HelpCard({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
      <h3 className="text-base font-semibold mb-2">Need Help?</h3>
      <p className="text-sm text-slate-300 mb-4">
        Check our documentation or contact support for assistance.
      </p>
      <button
        onClick={onNavigate}
        className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
      >
        View Documentation
      </button>
    </div>
  );
}
