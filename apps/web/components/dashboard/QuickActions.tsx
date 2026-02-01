'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  color?: 'default' | 'primary' | 'success' | 'warning';
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export function QuickActions({ actions, title = 'Quick Actions' }: QuickActionsProps) {
  const getColorStyles = (color: QuickAction['color'] = 'default') => {
    switch (color) {
      case 'primary':
        return 'bg-primary/10 text-primary hover:bg-primary/20';
      case 'success':
        return 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200';
      case 'warning':
        return 'bg-amber-100 text-amber-600 hover:bg-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all',
                'border border-transparent hover:border-slate-200 hover:shadow-sm',
                getColorStyles(action.color)
              )}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
