'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Search,
  Settings,
  Shield,
  Activity,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Stethoscope,
  ClipboardList,
  FileText,
  Pill,
  HeartPulse,
  Ambulance,
  RefreshCw,
  HelpCircle,
  ScrollText,
  ImageIcon,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

interface NavDropdown {
  id: string;
  name: string;
  icon: React.ElementType;
  children: NavItem[];
}

interface NavSection {
  id: string;
  name: string;
  items: (NavItem | NavDropdown)[];
}

// Check if item is a dropdown
function isDropdown(item: NavItem | NavDropdown): item is NavDropdown {
  return 'children' in item;
}

// Menu Configuration
const menuConfig: NavSection[] = [
  {
    id: 'main',
    name: '',
    items: [
      {
        id: 'dashboard' as NavItemId,
        name: 'Home',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'patient-list',
        name: 'Patient List',
        icon: Users,
        children: [
          {
            id: 'patients' as NavItemId,
            name: 'Patient Management',
            href: '/patients',
            icon: UserPlus,
          },
          {
            id: 'recent-patients' as NavItemId,
            name: 'Recent Patients',
            href: '/patients/recent',
            icon: Users,
          },
          {
            id: 'patient-search' as NavItemId,
            name: 'Patient Search',
            href: '/patients/search',
            icon: Search,
          },
          {
            id: 'clinical-discharge' as NavItemId,
            name: 'Clinical Discharge List',
            href: '/discharge/clinical',
            icon: ClipboardList,
          },
          {
            id: 'pharmacy-discharge' as NavItemId,
            name: 'Pharmacy Discharge List',
            href: '/discharge/pharmacy',
            icon: Pill,
          },
        ],
      },
      {
        id: 'clinical-apps',
        name: 'Clinical Apps',
        icon: Stethoscope,
        children: [
          {
            id: 'clinical-imaging' as NavItemId,
            name: 'Clinical Imaging',
            href: '/clinical/imaging',
            icon: ImageIcon,
          },
          {
            id: 'controlled-drugs' as NavItemId,
            name: 'Controlled Drugs',
            href: '/clinical/controlled-drugs',
            icon: Pill,
          },
          {
            id: 'emergency-care' as NavItemId,
            name: 'Emergency Care Services',
            href: '/clinical/emergency',
            icon: Ambulance,
          },
          {
            id: 'continued-care' as NavItemId,
            name: 'Continued Care',
            href: '/clinical/continued-care',
            icon: RefreshCw,
          },
        ],
      },
    ],
  },
  {
    id: 'business',
    name: 'Business Apps',
    items: [
      {
        id: 'helpdesk' as NavItemId,
        name: 'Helpdesk',
        href: '/business/helpdesk',
        icon: HelpCircle,
      },
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    items: [
      {
        id: 'users' as NavItemId,
        name: 'User Management',
        href: '/admin/users',
        icon: Shield,
      },
      {
        id: 'settings' as NavItemId,
        name: 'Settings',
        href: '/admin/settings',
        icon: Settings,
      },
      {
        id: 'audit-trails' as NavItemId,
        name: 'Audit Trails',
        href: '/admin/audit',
        icon: ScrollText,
      },
    ],
  },
];

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  nested?: boolean;
}

function NavItemComponent({
  item,
  isActive,
  isCollapsed,
  onClose,
  nested = false,
}: NavItemComponentProps) {
  const content = (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
        isCollapsed && 'justify-center px-2',
        nested && !isCollapsed && 'pl-10'
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
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

interface NavDropdownComponentProps {
  dropdown: NavDropdown;
  pathname: string;
  isCollapsed: boolean;
  onClose: () => void;
  userRole: string | undefined;
  openDropdowns: string[];
  toggleDropdown: (id: string) => void;
}

function NavDropdownComponent({
  dropdown,
  pathname,
  isCollapsed,
  onClose,
  userRole,
  openDropdowns,
  toggleDropdown,
}: NavDropdownComponentProps) {
  // Filter children based on permissions
  const permittedChildren = dropdown.children.filter((child) =>
    hasPermission(userRole, child.id)
  );

  if (permittedChildren.length === 0) {
    return null;
  }

  const isOpen = openDropdowns.includes(dropdown.id);
  const isAnyChildActive = permittedChildren.some(
    (child) => pathname === child.href
  );

  if (isCollapsed) {
    // In collapsed mode, show dropdown as expandable tooltip
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200',
              isAnyChildActive
                ? 'bg-primary/20 text-primary'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            )}
          >
            <dropdown.icon className="h-5 w-5 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0">
          <div className="flex flex-col py-1">
            <div className="px-3 py-2 text-sm font-semibold text-slate-400">
              {dropdown.name}
            </div>
            {permittedChildren.map((child) => (
              <Link
                key={child.id}
                href={child.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                  pathname === child.href
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-slate-100'
                )}
              >
                <child.icon className="h-4 w-4" />
                {child.name}
              </Link>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleDropdown(dropdown.id)}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
            isAnyChildActive
              ? 'bg-primary/20 text-primary'
              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
          )}
        >
          <div className="flex items-center gap-3">
            <dropdown.icon className="h-5 w-5 shrink-0" />
            <span>{dropdown.name}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pt-1">
        {permittedChildren.map((child) => (
          <NavItemComponent
            key={child.id}
            item={child}
            isActive={pathname === child.href}
            isCollapsed={isCollapsed}
            onClose={onClose}
            nested
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface NavSectionComponentProps {
  section: NavSection;
  pathname: string;
  isCollapsed: boolean;
  onClose: () => void;
  userRole: string | undefined;
  openDropdowns: string[];
  toggleDropdown: (id: string) => void;
}

function NavSectionComponent({
  section,
  pathname,
  isCollapsed,
  onClose,
  userRole,
  openDropdowns,
  toggleDropdown,
}: NavSectionComponentProps) {
  // Check if any items in this section are permitted
  const hasPermittedItems = section.items.some((item) => {
    if (isDropdown(item)) {
      return item.children.some((child) => hasPermission(userRole, child.id));
    }
    return hasPermission(userRole, item.id);
  });

  if (!hasPermittedItems) {
    return null;
  }

  return (
    <div className="space-y-1">
      {section.name && !isCollapsed && (
        <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {section.name}
        </h4>
      )}
      <nav className="space-y-1">
        {section.items.map((item) => {
          if (isDropdown(item)) {
            return (
              <NavDropdownComponent
                key={item.id}
                dropdown={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                onClose={onClose}
                userRole={userRole}
                openDropdowns={openDropdowns}
                toggleDropdown={toggleDropdown}
              />
            );
          }

          // Regular nav item
          if (!hasPermission(userRole, item.id)) {
            return null;
          }

          return (
            <NavItemComponent
              key={item.id}
              item={item}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
              onClose={onClose}
            />
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role;

  // Track which dropdowns are open
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  // Check which sections have permitted items
  const sectionsWithItems = menuConfig.filter((section) =>
    section.items.some((item) => {
      if (isDropdown(item)) {
        return item.children.some((child) => hasPermission(userRole, child.id));
      }
      return hasPermission(userRole, item.id);
    })
  );

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
        <div
          className={cn(
            'flex h-16 items-center border-b border-slate-800 px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-white">
                Clinical Portal
              </span>
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
            {sectionsWithItems.map((section, index) => (
              <div key={section.id}>
                {index > 0 && !isCollapsed && (
                  <Separator className="mb-4 bg-slate-800" />
                )}
                <NavSectionComponent
                  section={section}
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  onClose={onClose}
                  userRole={userRole}
                  openDropdowns={openDropdowns}
                  toggleDropdown={toggleDropdown}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div
          className={cn(
            'border-t border-slate-800 p-4',
            isCollapsed && 'flex justify-center'
          )}
        >
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
