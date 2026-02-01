'use client';

import { MoreHorizontal, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Appointment {
  id: string | number;
  patient: {
    name: string;
    avatar?: string;
  };
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

interface AppointmentsTableProps {
  appointments: Appointment[];
  title?: string;
  onViewAll?: () => void;
}

export function AppointmentsTable({
  appointments,
  title = "Today's Appointments",
  onViewAll,
}: AppointmentsTableProps) {
  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="text-primary" onClick={onViewAll}>
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Patient</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Time</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground w-10"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(appointment.patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{appointment.patient.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{appointment.time}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell text-muted-foreground">
                    {appointment.type}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={getStatusVariant(appointment.status)} className="capitalize">
                      {appointment.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
