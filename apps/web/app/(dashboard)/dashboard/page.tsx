'use client';

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
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AppointmentsTable } from '@/components/dashboard/AppointmentsTable';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Patients',
      value: '2,847',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'from last month',
    },
    {
      title: "Today's Appointments",
      value: '48',
      change: '+3',
      changeType: 'positive' as const,
      icon: Calendar,
      description: 'vs yesterday',
    },
    {
      title: 'Active Prescriptions',
      value: '1,234',
      change: '+5.2%',
      changeType: 'positive' as const,
      icon: Pill,
      description: 'this week',
    },
    {
      title: 'Pending Lab Results',
      value: '23',
      change: '8 urgent',
      changeType: 'negative' as const,
      icon: FileText,
      description: 'require review',
    },
  ];

  const activities = [
    {
      id: 1,
      title: 'Appointment Completed',
      description: 'Follow-up consultation with John Smith was completed successfully.',
      time: '5 minutes ago',
      icon: CheckCircle,
      type: 'success' as const,
    },
    {
      id: 2,
      title: 'New Patient Registered',
      description: 'Emily Johnson has been registered as a new patient.',
      time: '15 minutes ago',
      icon: UserPlus,
      type: 'default' as const,
    },
    {
      id: 3,
      title: 'Prescription Approved',
      description: 'Prescription #RX-4521 for Michael Brown has been approved.',
      time: '32 minutes ago',
      icon: Pill,
      type: 'success' as const,
    },
    {
      id: 4,
      title: 'Lab Results Pending',
      description: 'Lab results for Patient #P-2234 are awaiting review.',
      time: '1 hour ago',
      icon: Clock,
      type: 'warning' as const,
    },
    {
      id: 5,
      title: 'Critical Alert',
      description: 'Patient #P-8842 vitals require immediate attention.',
      time: '2 hours ago',
      icon: AlertCircle,
      type: 'danger' as const,
    },
  ];

  const quickActions = [
    {
      label: 'New Patient',
      href: '/patients/new',
      icon: UserPlus,
      color: 'primary' as const,
    },
    {
      label: 'Schedule',
      href: '/appointments/new',
      icon: Calendar,
      color: 'success' as const,
    },
    {
      label: 'Prescribe',
      href: '/prescriptions/new',
      icon: ClipboardList,
      color: 'warning' as const,
    },
    {
      label: 'Consult',
      href: '/consultations/new',
      icon: Stethoscope,
      color: 'default' as const,
    },
  ];

  const appointments = [
    {
      id: 1,
      patient: { name: 'John Smith' },
      time: '09:00 AM',
      type: 'Follow-up',
      status: 'confirmed' as const,
    },
    {
      id: 2,
      patient: { name: 'Emily Davis' },
      time: '10:30 AM',
      type: 'Consultation',
      status: 'pending' as const,
    },
    {
      id: 3,
      patient: { name: 'Michael Brown' },
      time: '11:45 AM',
      type: 'Check-up',
      status: 'confirmed' as const,
    },
    {
      id: 4,
      patient: { name: 'Sarah Wilson' },
      time: '02:00 PM',
      type: 'Lab Review',
      status: 'confirmed' as const,
    },
    {
      id: 5,
      patient: { name: 'Robert Taylor' },
      time: '03:30 PM',
      type: 'New Patient',
      status: 'pending' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        userName={user?.firstName}
        appointmentsToday={48}
        pendingTasks={12}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Table - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AppointmentsTable
            appointments={appointments}
            onViewAll={() => console.log('View all appointments')}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions actions={quickActions} />
        </div>
      </div>

      {/* Activity Feed - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} maxHeight="320px" />
        </div>

        {/* Summary Card */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-base font-semibold mb-4">Monthly Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Patients Seen</span>
                <span className="text-sm font-medium">847</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Appointments</span>
                <span className="text-sm font-medium">1,234</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Prescriptions</span>
                <span className="text-sm font-medium">562</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
            <h3 className="text-base font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-slate-300 mb-4">
              Check our documentation or contact support for assistance.
            </p>
            <button className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
