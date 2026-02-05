'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  LogOut,
  User,
  Settings,
  Menu,
  Search,
  HelpCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { patientsApi } from '@/lib/api/patients';

// CHI Number validation regex
const CHI_NUMBER_REGEX = /^[1-9]\d{7}[A-NP-TV-Z]\d{2}$/;

interface HeaderProps {
  onMenuToggle?: () => void;
}

const notifications = [
  {
    id: 1,
    title: 'New appointment request',
    description: 'John Smith requested an appointment for tomorrow',
    time: '5 min ago',
    unread: true,
  },
  {
    id: 2,
    title: 'Lab results ready',
    description: 'Patient #P-2847 lab results are now available',
    time: '1 hour ago',
    unread: true,
  },
  {
    id: 3,
    title: 'Prescription approved',
    description: 'Dr. Wilson approved prescription #RX-4521',
    time: '2 hours ago',
    unread: false,
  },
];

export function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const unreadCount = notifications.filter((n) => n.unread).length;

  // CHI Search state
  const [chiSearch, setChiSearch] = useState('');
  const [chiSearching, setChiSearching] = useState(false);
  const [chiError, setChiError] = useState('');

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatRole = (role?: string) => {
    return role?.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'User';
  };

  const handleChiSearch = async () => {
    const normalizedChi = chiSearch.trim().toUpperCase();

    if (!normalizedChi) {
      setChiError('');
      return;
    }

    // Validate CHI format
    if (!CHI_NUMBER_REGEX.test(normalizedChi)) {
      setChiError('Invalid CHI format');
      return;
    }

    setChiError('');
    setChiSearching(true);

    try {
      const response = await patientsApi.findByChiNumber(normalizedChi);
      if (response.success && response.data) {
        setChiSearch('');
        router.push(`/patients/${response.data.id}`);
      } else {
        setChiError('Patient not found');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setChiError('Patient not found');
      } else {
        setChiError('Search failed');
      }
    } finally {
      setChiSearching(false);
    }
  };

  const handleChiKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleChiSearch();
    }
  };

  const handleChiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChiSearch(e.target.value.toUpperCase());
    setChiError('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* CHI Quick Search */}
          <div className="hidden sm:flex relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter CHI Number..."
              value={chiSearch}
              onChange={handleChiChange}
              onKeyDown={handleChiKeyPress}
              className={cn(
                "w-56 pl-9 pr-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors font-mono uppercase",
                chiError && "border-destructive focus-visible:ring-destructive"
              )}
              disabled={chiSearching}
            />
            {chiSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            ) : chiError ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{chiError}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={handleChiSearch}
                disabled={!chiSearch.trim()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <p className={cn(
                        "text-sm font-medium leading-none",
                        notification.unread && "text-foreground",
                        !notification.unread && "text-muted-foreground"
                      )}>
                        {notification.title}
                      </p>
                      {notification.unread && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {notification.time}
                    </p>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary cursor-pointer">
                View all notifications
                <ChevronRight className="h-4 w-4 ml-1" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 px-2 hover:bg-slate-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.firstName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRole(user?.role)}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
