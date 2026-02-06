'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  FileText,
  UserPlus,
  ClipboardList,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Activity,
  Heart,
  ShieldCheck,
  Building2,
  RefreshCw,
  AlertTriangle,
  Syringe,
  MonitorCheck,
  ClipboardCheck,
  ListChecks,
  BedDouble,
  Ambulance,
  ArrowRight,
  Pill,
  Package,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ROLES } from '@/lib/permissions';
import { clinicalApi } from '@/lib/api/clinical';
import { hospitalsApi } from '@/lib/api/hospitals';
import type {
  DashboardStats,
  AdminDashboardStats,
  DoctorDashboardStats,
  NurseDashboardStats,
  PharmacistDashboardStats,
  HospitalDashboardStats,
  CarePlanSubStats,
  DischargeSubStats,
  ImagingSubStats,
  ControlledDrugSubStats,
} from '@/lib/types/clinical';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { QuickActions } from '@/components/dashboard/QuickActions';
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
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple';
  loading?: boolean;
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

const colorMap: Record<string, { bg: string; iconColor: string; ring: string }> = {
  blue: { bg: 'bg-blue-50', iconColor: 'text-blue-600', ring: 'ring-blue-100' },
  green: { bg: 'bg-emerald-50', iconColor: 'text-emerald-600', ring: 'ring-emerald-100' },
  amber: { bg: 'bg-amber-50', iconColor: 'text-amber-600', ring: 'ring-amber-100' },
  red: { bg: 'bg-red-50', iconColor: 'text-red-600', ring: 'ring-red-100' },
  slate: { bg: 'bg-slate-50', iconColor: 'text-slate-600', ring: 'ring-slate-100' },
  purple: { bg: 'bg-purple-50', iconColor: 'text-purple-600', ring: 'ring-purple-100' },
};

function EnhancedStatCard({ title, value, subtitle, icon: Icon, color = 'blue', loading = false }: EnhancedStatCardProps) {
  if (loading) return <SkeletonStatCard />;
  const colors = colorMap[color] ?? colorMap.blue;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${colors.bg} ring-1 ${colors.ring}`}>
            <Icon className={`h-5 w-5 ${colors.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Patient Journey Pipeline (Admin) — the core business visualization
// ---------------------------------------------------------------------------

const journeyStageColors = [
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
];

function PatientJourneyPipeline({ patientFlow }: { patientFlow: AdminDashboardStats['patientFlow'] }) {
  const stages = [
    { label: 'Registered', count: patientFlow.totalPatientsRegistered },
    { label: 'Scheduled Today', count: patientFlow.scheduledToday },
    { label: 'Checked In', count: patientFlow.checkedInToday },
    { label: 'Admitted', count: patientFlow.currentlyAdmitted },
    { label: 'Awaiting Discharge', count: patientFlow.awaitingDischarge },
    { label: 'Discharged Today', count: patientFlow.dischargedToday },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Patient Journey</CardTitle>
        <CardDescription>Real-time patient flow across the hospital</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
          {stages.map((stage, i) => {
            const stageColor = journeyStageColors[i];
            return (
              <Fragment key={stage.label}>
                <div className={`flex-1 min-w-[100px] rounded-lg border p-4 text-center ${stageColor.bg} ${stageColor.border}`}>
                  <p className={`text-2xl font-bold ${stageColor.text}`}>{stage.count.toLocaleString()}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">{stage.label}</p>
                </div>
                {i < stages.length - 1 && (
                  <div className="flex items-center shrink-0 px-0.5">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Ward Occupancy Bar
// ---------------------------------------------------------------------------

function WardOccupancyBar({ name, occupied, total }: { name: string; occupied: number; total: number }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const badgeVariant = pct >= 90 ? 'destructive' : pct >= 70 ? 'warning' : 'secondary';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate mr-2">{name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-muted-foreground text-xs">{occupied}/{total} beds</span>
          <Badge variant={badgeVariant as any} className="text-xs tabular-nums">{pct}%</Badge>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safe(val: number | undefined | null): number {
  return val ?? 0;
}

function getQuickActionsForRole(role: string | undefined): QuickActionConfig[] {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.CLINICAL_ADMIN:
      return [
        { label: 'Manage Users', href: '/users', icon: Users, color: 'primary' },
        { label: 'Hospitals', href: '/admin/hospitals', icon: Building2, color: 'success' },
        { label: 'Audit Trails', href: '/admin/audit', icon: ShieldCheck, color: 'warning' },
        { label: 'Settings', href: '/admin/settings', icon: MonitorCheck, color: 'default' },
      ];
    case ROLES.DOCTOR:
    case ROLES.CONSULTANT:
      return [
        { label: 'New Patient', href: '/patients/new', icon: UserPlus, color: 'primary' },
        { label: 'Schedule', href: '/appointments/new', icon: Calendar, color: 'success' },
        { label: 'Prescribe', href: '/prescriptions/new', icon: ClipboardList, color: 'warning' },
        { label: 'Imaging', href: '/clinical/imaging', icon: MonitorCheck, color: 'default' },
      ];
    case ROLES.NURSE:
      return [
        { label: 'Record Vitals', href: '/patients', icon: Heart, color: 'primary' },
        { label: 'Care Plans', href: '/clinical/continued-care', icon: ClipboardList, color: 'success' },
        { label: 'Emergency', href: '/clinical/emergency', icon: AlertCircle, color: 'warning' },
        { label: 'Discharge', href: '/discharge/clinical', icon: FileText, color: 'default' },
      ];
    case ROLES.HOSPITAL_PHARMACIST:
      return [
        { label: 'Review Rx', href: '/prescriptions', icon: ClipboardCheck, color: 'primary' },
        { label: 'CD Register', href: '/clinical/controlled-drugs', icon: ShieldCheck, color: 'success' },
        { label: 'Discharge Rx', href: '/discharge/pharmacy', icon: FileText, color: 'warning' },
        { label: 'Patients', href: '/patients', icon: Users, color: 'default' },
      ];
    case ROLES.PRESCRIBER:
      return [
        { label: 'New Prescription', href: '/prescriptions/new', icon: Pill, color: 'primary' },
        { label: 'CD Register', href: '/clinical/controlled-drugs', icon: ShieldCheck, color: 'success' },
        { label: 'Patients', href: '/patients', icon: Users, color: 'warning' },
        { label: 'Appointments', href: '/appointments', icon: Calendar, color: 'default' },
      ];
    case ROLES.PHARMACY_TECHNICIAN:
    case ROLES.PHARMACY_SUPPORT_WORKER:
    case ROLES.PHARMACY_SUPPORT_MANAGER:
      return [
        { label: 'Dispensing', href: '/discharge/pharmacy', icon: Package, color: 'primary' },
        { label: 'Stock Check', href: '/inventory', icon: ListChecks, color: 'success' },
        { label: 'Patients', href: '/patients', icon: Users, color: 'warning' },
        { label: 'Helpdesk', href: '/business/helpdesk', icon: Syringe, color: 'default' },
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

// ---------------------------------------------------------------------------
// Care Plans Section (shared across roles)
// ---------------------------------------------------------------------------

function CarePlansCard({ stats }: { stats: CarePlanSubStats | Record<string, any> }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Care Plans</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Active Plans</span>
          <span className="text-sm font-semibold">{safe(stats?.activePlans)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Reviews Due This Week</span>
          <Badge variant={safe(stats?.reviewsDueThisWeek) > 0 ? 'warning' : 'secondary'} className="text-xs">
            {safe(stats?.reviewsDueThisWeek)}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overdue Reviews</span>
          <Badge variant={safe(stats?.overdueReviews) > 0 ? 'destructive' : 'secondary'} className="text-xs">
            {safe(stats?.overdueReviews)}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Completed This Month</span>
          <span className="text-sm font-medium">{safe(stats?.completedThisMonth)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Help Card
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

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hospStats, setHospStats] = useState<HospitalDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [statsResult, hospResult] = await Promise.allSettled([
      clinicalApi.getDashboardStats({ role: user?.role }),
      hospitalsApi.getDashboardStats(),
    ]);

    if (statsResult.status === 'fulfilled' && statsResult.value?.success && statsResult.value.data) {
      setStats(statsResult.value.data);
    } else {
      const errMsg =
        statsResult.status === 'rejected'
          ? statsResult.reason?.response?.data?.message || statsResult.reason?.message || 'Failed to load dashboard data.'
          : 'Failed to load dashboard data.';
      setError(errMsg);
    }

    if (hospResult.status === 'fulfilled' && hospResult.value?.success) {
      setHospStats(hospResult.value.data);
    }

    setIsLoading(false);
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-slate-100 p-6 animate-pulse h-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="rounded-xl bg-slate-100 p-6 animate-pulse h-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={`r2-${i}`} />)}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Unable to load dashboard</h2>
          <p className="text-sm text-muted-foreground max-w-md">{error || 'No data was returned from the server.'}</p>
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

  const role = user?.role;
  const quickActions = getQuickActionsForRole(role);
  const isAdmin = role === ROLES.SUPER_ADMIN || role === ROLES.CLINICAL_ADMIN;
  const isDoctor = role === ROLES.DOCTOR || role === ROLES.CONSULTANT;
  const isNurse = role === ROLES.NURSE;
  const isPharmacist =
    role === ROLES.HOSPITAL_PHARMACIST ||
    role === ROLES.PHARMACY_TECHNICIAN ||
    role === ROLES.PHARMACY_SUPPORT_MANAGER ||
    role === ROLES.PHARMACY_SUPPORT_WORKER;

  // Ward occupancy entries from hospital stats
  const wardOccupancyEntries = hospStats?.byWard
    ? Object.entries(hospStats.byWard).map(([name, info]) => ({
        name,
        occupied: info.occupied,
        total: info.total,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* ADMIN / CLINICAL ADMIN DASHBOARD                                  */}
      {/* ================================================================= */}
      {isAdmin && (() => {
        const s = stats as AdminDashboardStats;
        const pf = s.patientFlow ?? {} as any;
        const em = s.emergency ?? {} as any;
        const ap = s.appointments ?? {} as any;
        const disc = s.discharge ?? {} as any;
        const img = s.imaging ?? {} as any;
        const cd = s.controlledDrugs ?? {} as any;
        const cp = s.carePlans ?? {} as any;

        return (
          <>
            <WelcomeBanner
              userName={user?.firstName}
              appointmentsToday={safe(pf.scheduledToday)}
              pendingTasks={safe(disc.activeForms) + safe(img.pendingRequests) + safe(em.emergencyWaiting)}
            />

            {/* Patient Journey Pipeline */}
            <PatientJourneyPipeline patientFlow={pf} />

            {/* Emergency + Appointment Outcomes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <EnhancedStatCard
                title="Emergency Waiting"
                value={safe(em.emergencyWaiting)}
                subtitle={`${safe(em.emergencyBeingSeen)} being seen`}
                icon={Ambulance}
                color="red"
              />
              <EnhancedStatCard
                title="Appointments Completed"
                value={safe(ap.appointmentsCompletedToday)}
                subtitle="today"
                icon={CheckCircle}
                color="green"
              />
              <EnhancedStatCard
                title="Cancelled"
                value={safe(ap.appointmentsCancelledToday)}
                subtitle="today"
                icon={AlertCircle}
                color="amber"
              />
              <EnhancedStatCard
                title="No-Shows"
                value={safe(ap.appointmentsNoShowToday)}
                subtitle="today"
                icon={AlertTriangle}
                color={safe(ap.appointmentsNoShowToday) > 0 ? 'red' : 'slate'}
              />
              <EnhancedStatCard
                title="Beds Available"
                value={safe(hospStats?.availableBeds)}
                subtitle={`${safe(hospStats?.occupancyRate)}% occupancy`}
                icon={BedDouble}
                color="slate"
              />
            </div>

            {/* Discharge + Imaging + Controlled Drugs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EnhancedStatCard
                title="Discharge Forms Active"
                value={safe(disc.activeForms)}
                subtitle={`${safe(disc.pendingPharmacyReview)} pending pharmacy`}
                icon={FileText}
                color={safe(disc.activeForms) > 0 ? 'amber' : 'green'}
              />
              <EnhancedStatCard
                title="Imaging Pending"
                value={safe(img.pendingRequests)}
                subtitle={`${safe(img.urgentPending)} urgent, ${safe(img.scheduledToday)} scheduled today`}
                icon={MonitorCheck}
                color={safe(img.urgentPending) > 0 ? 'red' : 'blue'}
              />
              <EnhancedStatCard
                title="Controlled Drug Entries"
                value={safe(cd.totalEntriesToday)}
                subtitle="today"
                icon={ShieldCheck}
                color={safe(cd.totalEntriesToday) > 0 ? 'amber' : 'green'}
              />
              <EnhancedStatCard
                title="Active Care Plans"
                value={safe(cp.activePlans)}
                subtitle={`${safe(cp.overdueReviews)} overdue reviews`}
                icon={ClipboardList}
                color={safe(cp.overdueReviews) > 0 ? 'red' : 'blue'}
              />
            </div>

            {/* Ward Occupancy */}
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
                    <Badge variant="outline" className="text-xs">{safe(hospStats?.occupancyRate)}% overall</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {wardOccupancyEntries.map((ward) => (
                      <WardOccupancyBar key={ward.name} name={ward.name} occupied={ward.occupied} total={ward.total} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions + Care Plans + Help */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuickActions actions={quickActions} />
              <CarePlansCard stats={cp} />
              <HelpCard onNavigate={() => router.push('/business/helpdesk')} />
            </div>
          </>
        );
      })()}

      {/* ================================================================= */}
      {/* DOCTOR / CONSULTANT DASHBOARD                                     */}
      {/* ================================================================= */}
      {isDoctor && (() => {
        const s = stats as DoctorDashboardStats;
        const cp = s.carePlans ?? {} as any;

        return (
          <>
            <WelcomeBanner
              userName={user?.firstName}
              appointmentsToday={safe(s.myAppointmentsToday)}
              pendingTasks={safe(s.pendingDischarges) + safe(s.patientsInProgress)}
            />

            {/* Primary metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EnhancedStatCard
                title="My Appointments Today"
                value={safe(s.myAppointmentsToday)}
                icon={Calendar}
                color="blue"
              />
              <EnhancedStatCard
                title="Patients In Progress"
                value={safe(s.patientsInProgress)}
                subtitle="currently being seen"
                icon={Users}
                color="green"
              />
              <EnhancedStatCard
                title="Active Encounters"
                value={safe(s.activeEncounters)}
                subtitle={`${safe(s.pendingDischarges)} pending discharge`}
                icon={Stethoscope}
                color="amber"
              />
              <EnhancedStatCard
                title="Completed Today"
                value={safe(s.completedToday)}
                subtitle="appointments finished"
                icon={CheckCircle}
                color="green"
              />
            </div>

            {/* Pending discharges highlight */}
            {safe(s.pendingDischarges) > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {s.pendingDischarges} patient{s.pendingDischarges !== 1 ? 's' : ''} awaiting discharge
                      </p>
                      <p className="text-xs text-muted-foreground">Review and complete discharge forms to proceed</p>
                    </div>
                    <button
                      onClick={() => router.push('/discharge/clinical')}
                      className="text-sm text-amber-700 font-medium hover:underline"
                    >
                      View Discharges
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick actions + Care plans + Help */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuickActions actions={quickActions} />
              <CarePlansCard stats={cp} />
              <HelpCard onNavigate={() => router.push('/business/helpdesk')} />
            </div>
          </>
        );
      })()}

      {/* ================================================================= */}
      {/* NURSE DASHBOARD                                                   */}
      {/* ================================================================= */}
      {isNurse && (() => {
        const s = stats as NurseDashboardStats;
        const cp = s.carePlans ?? {} as any;

        return (
          <>
            <WelcomeBanner
              userName={user?.firstName}
              appointmentsToday={safe(s.admissionsToday)}
              pendingTasks={safe(s.pendingAssessments)}
            />

            {/* Primary metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EnhancedStatCard
                title="Patients in Ward"
                value={safe(s.patientsInWard)}
                icon={BedDouble}
                color="blue"
              />
              <EnhancedStatCard
                title="Admissions Today"
                value={safe(s.admissionsToday)}
                icon={UserPlus}
                color="green"
              />
              <EnhancedStatCard
                title="Discharges Today"
                value={safe(s.dischargesToday)}
                icon={FileText}
                color="amber"
              />
              <EnhancedStatCard
                title="Pending Assessments"
                value={safe(s.pendingAssessments)}
                subtitle={safe(s.pendingAssessments) > 0 ? 'needs review' : 'all clear'}
                icon={ClipboardCheck}
                color={safe(s.pendingAssessments) > 0 ? 'red' : 'green'}
              />
            </div>

            {/* Beds available if hospital stats loaded */}
            {hospStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <EnhancedStatCard
                  title="Beds Available"
                  value={safe(hospStats.availableBeds)}
                  subtitle={`${safe(hospStats.occupancyRate)}% occupancy`}
                  icon={BedDouble}
                  color="slate"
                />
                <EnhancedStatCard
                  title="Active Care Plans"
                  value={safe(cp.activePlans)}
                  subtitle={`${safe(cp.overdueReviews)} overdue`}
                  icon={ClipboardList}
                  color={safe(cp.overdueReviews) > 0 ? 'red' : 'blue'}
                />
                <EnhancedStatCard
                  title="Reviews Due This Week"
                  value={safe(cp.reviewsDueThisWeek)}
                  icon={Heart}
                  color={safe(cp.reviewsDueThisWeek) > 0 ? 'amber' : 'green'}
                />
              </div>
            )}

            {/* Ward Occupancy */}
            {wardOccupancyEntries.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Ward Occupancy</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {wardOccupancyEntries.map((ward) => (
                      <WardOccupancyBar key={ward.name} name={ward.name} occupied={ward.occupied} total={ward.total} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick actions + Help */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuickActions actions={quickActions} />
              <CarePlansCard stats={cp} />
              <HelpCard onNavigate={() => router.push('/business/helpdesk')} />
            </div>
          </>
        );
      })()}

      {/* ================================================================= */}
      {/* PHARMACIST DASHBOARD                                              */}
      {/* ================================================================= */}
      {isPharmacist && (() => {
        const s = stats as PharmacistDashboardStats;
        const disc = s.discharge ?? {} as any;
        const cd = s.controlledDrugs ?? {} as any;

        return (
          <>
            <WelcomeBanner
              userName={user?.firstName}
              appointmentsToday={safe(s.pendingPharmacyReviews)}
              pendingTasks={safe(s.pendingPharmacyReviews) + safe(s.controlledDrugEntriesToday)}
            />

            {/* Primary metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EnhancedStatCard
                title="Pending Pharmacy Reviews"
                value={safe(s.pendingPharmacyReviews)}
                subtitle="patients awaiting discharge"
                icon={ClipboardCheck}
                color={safe(s.pendingPharmacyReviews) > 0 ? 'red' : 'green'}
              />
              <EnhancedStatCard
                title="CD Entries Today"
                value={safe(s.controlledDrugEntriesToday)}
                subtitle="requires witness"
                icon={ShieldCheck}
                color={safe(s.controlledDrugEntriesToday) > 0 ? 'amber' : 'green'}
              />
              <EnhancedStatCard
                title="Active Discharge Forms"
                value={safe(disc.activeForms)}
                subtitle={`${safe(disc.pendingPharmacyReview)} pharmacy pending`}
                icon={FileText}
                color="amber"
              />
              <EnhancedStatCard
                title="Pending Clinical Review"
                value={safe(disc.pendingClinicalReview)}
                subtitle={`${safe(disc.pendingNursingReview)} nursing pending`}
                icon={Activity}
                color="slate"
              />
            </div>

            {/* Controlled Drug Breakdown */}
            {Array.isArray(cd.topDrugs) && cd.topDrugs.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Top Controlled Drugs Today</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {cd.topDrugs.slice(0, 5).map((drug: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50/50">
                        <span className="text-sm font-medium">{drug.drugName}</span>
                        <Badge variant="outline" className="text-xs">{drug.count} entries</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick actions + Help */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuickActions actions={quickActions} />
              <div className="space-y-4">
                <HelpCard onNavigate={() => router.push('/business/helpdesk')} />
              </div>
            </div>
          </>
        );
      })()}

      {/* ================================================================= */}
      {/* DEFAULT / OTHER ROLES                                             */}
      {/* ================================================================= */}
      {!isAdmin && !isDoctor && !isNurse && !isPharmacist && (() => {
        const s = stats as any;
        const enc = s.encounters ?? {};
        const apt = s.appointments ?? {};
        const disc = s.discharge ?? {};
        const img = s.imaging ?? {};
        const em = s.emergency ?? {};
        const cp = s.carePlans ?? {};

        return (
          <>
            <WelcomeBanner userName={user?.firstName} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EnhancedStatCard
                title="Active Encounters"
                value={safe(enc.activeEncounters ?? enc.totalActive)}
                icon={Stethoscope}
                color="blue"
              />
              <EnhancedStatCard
                title="Appointments Today"
                value={safe(apt.todayAppointments ?? apt.totalToday)}
                icon={Calendar}
                color="green"
              />
              <EnhancedStatCard
                title="Emergency Active"
                value={safe(em.totalActive ?? em.emergencyWaiting)}
                icon={Ambulance}
                color={safe(em.totalActive ?? em.emergencyWaiting) > 0 ? 'red' : 'slate'}
              />
              <EnhancedStatCard
                title="Active Care Plans"
                value={safe(cp.activePlans)}
                icon={ClipboardList}
                color="slate"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <EnhancedStatCard
                title="Discharge Forms Active"
                value={safe(disc.activeForms)}
                icon={FileText}
                color="amber"
              />
              <EnhancedStatCard
                title="Imaging Pending"
                value={safe(img.pendingRequests)}
                icon={MonitorCheck}
                color="blue"
              />
              <EnhancedStatCard
                title="CD Entries Today"
                value={safe(s.controlledDrugs?.totalEntriesToday)}
                icon={ShieldCheck}
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuickActions actions={quickActions} />
              <CarePlansCard stats={cp} />
              <HelpCard onNavigate={() => router.push('/business/helpdesk')} />
            </div>
          </>
        );
      })()}
    </div>
  );
}
