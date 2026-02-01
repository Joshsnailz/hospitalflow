'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Activity {
  id: string | number;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
  type: 'default' | 'success' | 'warning' | 'danger';
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  maxHeight?: string;
}

export function ActivityFeed({ activities, title = 'Recent Activity', maxHeight = '400px' }: ActivityFeedProps) {
  const getTypeStyles = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
      case 'warning':
        return { bg: 'bg-amber-100', text: 'text-amber-600' };
      case 'danger':
        return { bg: 'bg-red-100', text: 'text-red-600' };
      default:
        return { bg: 'bg-primary/10', text: 'text-primary' };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-4 pr-4">
            {activities.map((activity, index) => {
              const styles = getTypeStyles(activity.type);
              return (
                <div
                  key={activity.id}
                  className={cn(
                    'flex gap-4 p-3 rounded-lg transition-colors hover:bg-slate-50',
                    index !== activities.length - 1 && 'border-b border-slate-100 pb-4'
                  )}
                >
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', styles.bg)}>
                    <activity.icon className={cn('h-5 w-5', styles.text)} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                    <p className="text-xs text-muted-foreground/70">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
