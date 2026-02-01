'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Pill,
  Settings,
  Shield,
  Activity,
  X,
  ChevronLeft,
  Stethoscope,
  ClipboardList,
  Building2,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth/AuthContext';
import { hasPermission, type NavItemId } from '@/lib/permissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: NavItemId;
  name: string;
  href: string;
  icon: React.ElementType;
}

const mainNavigation: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'patients', name: 'Patients', href: '/patients', icon: Users },
  { id: 'appointments', name: 'Appointments', href: '/appointments', icon: Calendar },
  { id: 'records', name: 'Medical Records', href: '/records', icon: FileText },
];

const clinicalNavigation: NavItem[] = [
  { id: 'prescriptions', name: 'Prescriptions', href: '/prescriptions', icon: Pill },
  { id: 'lab-results', name: 'Lab Results', href: '/lab-results', icon: ClipboardList },
  { id: 'vitals', name: 'Vitals', href: '/vitals', icon: HeartPulse },
  { id: 'consultations', name: 'Consultations', href: '/consultations', icon: Stethoscope },
];

const adminNavigation: NavItem[] = [
  { id: 'users', name: 'User Management', href: '/users', icon: Shield },
  { id: 'departments', name: 'Departments', href: '/departments', icon: Building2 },
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings },
];

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClose: () => void;
}

function NavItemComponent({ item, isActive, isCollapsed, onClose }: NavItemComponentProps) {
  const content = (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <item.icon className={cn('h-5 w-5 shrink-0', isCollapsed && 'h-5 w-5')} />
      {!isCollapsed && <span>{item.name}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

interface NavGroupProps {
  label: string;
  items: NavItem[];
  pathname: string;
  isCollapsed: boolean;
  onClose: () => void;
  userRole: string | undefined;
}

function NavGroup({ label, items, pathname, isCollapsed, onClose, userRole }: NavGroupProps) {
  // Filter items based on user permissions
  const permittedItems = items.filter((item) => hasPermission(userRole, item.id));

  // Don't render the group if no items are permitted
  if (permittedItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </h4>
      )}
      <nav className="space-y-1">
        {permittedItems.map((item) => (
          <NavItemComponent
            key={item.name}
            item={item}
            isActive={pathname === item.href}
            isCollapsed={isCollapsed}
            onClose={onClose}
          />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role;

  // Check if any items exist in each section for the current user
  const hasMainItems = mainNavigation.some((item) => hasPermission(userRole, item.id));
  const hasClinicalItems = clinicalNavigation.some((item) => hasPermission(userRole, item.id));
  const hasAdminItems = adminNavigation.some((item) => hasPermission(userRole, item.id));

  return (
    <TooltipProvider>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, part of flex layout
          'lg:relative lg:translate-x-0',
          // Width
          isCollapsed ? 'w-[70px]' : 'w-64',
          // Shrink prevention
          'shrink-0'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex h-16 items-center border-b border-slate-800 px-4',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-white">Clinical Portal</span>
            )}
          </Link>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Desktop collapse button */}
          {onToggleCollapse && !isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            {hasMainItems && (
              <NavGroup
                label="Overview"
                items={mainNavigation}
                pathname={pathname}
                isCollapsed={isCollapsed}
                onClose={onClose}
                userRole={userRole}
              />
            )}

            {hasMainItems && hasClinicalItems && !isCollapsed && (
              <Separator className="bg-slate-800" />
            )}

            {hasClinicalItems && (
              <NavGroup
                label="Clinical"
                items={clinicalNavigation}
                pathname={pathname}
                isCollapsed={isCollapsed}
                onClose={onClose}
                userRole={userRole}
              />
            )}

            {hasClinicalItems && hasAdminItems && !isCollapsed && (
              <Separator className="bg-slate-800" />
            )}

            {hasAdminItems && (
              <NavGroup
                label="Administration"
                items={adminNavigation}
                pathname={pathname}
                isCollapsed={isCollapsed}
                onClose={onClose}
                userRole={userRole}
              />
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className={cn(
          'border-t border-slate-800 p-4',
          isCollapsed && 'flex justify-center'
        )}>
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <ChevronLeft className="h-5 w-5 rotate-180" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <HeartPulse className="h-4 w-4 text-primary" />
              <span>Clinical Portal v2.0</span>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
