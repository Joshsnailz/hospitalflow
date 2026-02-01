'use client';

import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeBannerProps {
  userName?: string;
  appointmentsToday?: number;
  pendingTasks?: number;
}

export function WelcomeBanner({ userName, appointmentsToday = 0, pendingTasks = 0 }: WelcomeBannerProps) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-blue-700 p-6 text-white shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {greeting}, {userName || 'there'}!
          </h1>
          <p className="text-white/80 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-white/90">
                <span className="font-semibold">{appointmentsToday}</span> appointments today
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-sm text-white/90">
                <span className="font-semibold">{pendingTasks}</span> pending tasks
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            View Schedule
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
