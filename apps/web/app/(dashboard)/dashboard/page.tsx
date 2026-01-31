'use client';

import {
  Users,
  Calendar,
  Activity,
  Pill,
  TrendingUp,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Patients',
      value: '2,847',
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: Users,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
    },
    {
      title: "Today's Appointments",
      value: '48',
      change: '6 pending confirmation',
      changeType: 'neutral' as const,
      icon: Calendar,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
    },
    {
      title: 'Active Prescriptions',
      value: '1,234',
      change: '+5% this week',
      changeType: 'positive' as const,
      icon: Pill,
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
    },
    {
      title: 'Pending Lab Results',
      value: '23',
      change: '8 urgent',
      changeType: 'negative' as const,
      icon: FileText,
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'appointment',
      message: 'New appointment scheduled with Dr. Johnson',
      time: '5 minutes ago',
      icon: Calendar,
    },
    {
      id: 2,
      type: 'prescription',
      message: 'Prescription #RX-4521 approved',
      time: '12 minutes ago',
      icon: Pill,
    },
    {
      id: 3,
      type: 'lab',
      message: 'Lab results received for Patient #P-8842',
      time: '25 minutes ago',
      icon: FileText,
    },
    {
      id: 4,
      type: 'alert',
      message: 'Critical alert: Patient #P-2234 vitals update',
      time: '1 hour ago',
      icon: AlertCircle,
    },
  ];

  const upcomingAppointments = [
    {
      id: 1,
      patient: 'John Smith',
      time: '09:00 AM',
      type: 'Follow-up',
      status: 'Confirmed',
    },
    {
      id: 2,
      patient: 'Emily Davis',
      time: '10:30 AM',
      type: 'Consultation',
      status: 'Pending',
    },
    {
      id: 3,
      patient: 'Michael Brown',
      time: '11:45 AM',
      type: 'Check-up',
      status: 'Confirmed',
    },
    {
      id: 4,
      patient: 'Sarah Wilson',
      time: '02:00 PM',
      type: 'Lab Review',
      status: 'Confirmed',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-slate-600 mt-1">
            Here&apos;s what&apos;s happening with your patients today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2 text-sm text-slate-500">
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Upcoming Appointments
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                    Patient
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {appointment.patient.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {appointment.patient}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {appointment.time}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {appointment.type}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'Confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Activity
            </h2>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg ${
                    activity.type === 'alert'
                      ? 'bg-red-100'
                      : activity.type === 'prescription'
                        ? 'bg-purple-100'
                        : 'bg-blue-100'
                  }`}
                >
                  <activity.icon
                    className={`h-4 w-4 ${
                      activity.type === 'alert'
                        ? 'text-red-600'
                        : activity.type === 'prescription'
                          ? 'text-purple-600'
                          : 'text-blue-600'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">{activity.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Monthly Performance</h3>
              <p className="text-blue-100">
                Patient satisfaction rate is up 8% this month
              </p>
            </div>
          </div>
          <button className="mt-4 sm:mt-0 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            View Report
          </button>
        </div>
      </div>
    </div>
  );
}
