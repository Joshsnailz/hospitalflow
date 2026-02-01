'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeValue?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  description?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeValue,
  changeType = 'neutral',
  icon: Icon,
  description,
}: StatsCardProps) {
  const TrendIcon = changeType === 'positive'
    ? TrendingUp
    : changeType === 'negative'
    ? TrendingDown
    : Minus;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {change && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    changeType === 'positive' && 'text-emerald-600',
                    changeType === 'negative' && 'text-red-600',
                    changeType === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  <span>{change}</span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            'bg-primary/10'
          )}>
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
