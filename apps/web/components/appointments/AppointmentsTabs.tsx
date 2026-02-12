'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { isAdmin as isAdminRole } from '@/lib/permissions';
import type { ReactNode } from 'react';

interface AppointmentsTabsProps {
  role: string | undefined;
  activeTab: string;
  onTabChange: (tab: string) => void;
  queueCount?: number;
  requestsCount?: number;
  children: {
    overview?: ReactNode;
    today?: ReactNode;
    mySchedule?: ReactNode;
    queue: ReactNode;
    requests?: ReactNode;
  };
}

export function AppointmentsTabs({
  role,
  activeTab,
  onTabChange,
  queueCount = 0,
  requestsCount = 0,
  children,
}: AppointmentsTabsProps) {
  const admin = isAdminRole(role);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        {admin && <TabsTrigger value="overview">All Appointments</TabsTrigger>}
        {admin && <TabsTrigger value="today">Today&apos;s Schedule</TabsTrigger>}
        {!admin && <TabsTrigger value="my-schedule">My Schedule</TabsTrigger>}
        <TabsTrigger value="queue" className="gap-2">
          Queue
          {queueCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] rounded-full px-1.5 text-[10px]">
              {queueCount}
            </Badge>
          )}
        </TabsTrigger>
        {admin && (
          <TabsTrigger value="requests" className="gap-2">
            Requests
            {requestsCount > 0 && (
              <Badge variant="warning" className="ml-1 h-5 min-w-[20px] rounded-full px-1.5 text-[10px]">
                {requestsCount}
              </Badge>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      {admin && <TabsContent value="overview">{children.overview}</TabsContent>}
      {admin && <TabsContent value="today">{children.today}</TabsContent>}
      {!admin && <TabsContent value="my-schedule">{children.mySchedule}</TabsContent>}
      <TabsContent value="queue">{children.queue}</TabsContent>
      {admin && <TabsContent value="requests">{children.requests}</TabsContent>}
    </Tabs>
  );
}
