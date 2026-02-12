'use client';

import { useState, useCallback, useRef } from 'react';
import { usersApi } from '@/lib/api/users';
import type { User } from '@/lib/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, X } from 'lucide-react';

interface StaffSearchInputProps {
  value: string; // userId or name
  onValueChange: (value: string) => void;
  onStaffSelect?: (user: User | null) => void;
  role?: string; // filter by role (e.g., 'doctor')
  disabled?: boolean;
  placeholder?: string;
}

export function StaffSearchInput({
  value,
  onValueChange,
  onStaffSelect,
  role,
  disabled = false,
  placeholder = 'Type staff name to search...',
}: StaffSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  const searchStaff = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      setIsSearching(true);
      const response = await usersApi.findAll({ search: query, role, limit: 10 });
      if (response.success) {
        setResults(response.data);
        setShowDropdown(true);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [role]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (selectedStaff) {
      setSelectedStaff(null);
      onValueChange('');
      onStaffSelect?.(null);
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchStaff(val);
    }, 300);
  };

  const selectStaff = (user: User) => {
    setSelectedStaff(user);
    setSearchQuery('');
    setShowDropdown(false);
    setResults([]);
    onValueChange(user.id);
    onStaffSelect?.(user);
  };

  const clearSelection = () => {
    setSelectedStaff(null);
    setSearchQuery('');
    setResults([]);
    setShowDropdown(false);
    onValueChange('');
    onStaffSelect?.(null);
    inputRef.current?.focus();
  };

  if (selectedStaff) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
        <div>
          <p className="font-medium text-sm">
            {selectedStaff.firstName} {selectedStaff.lastName}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span className="capitalize">{selectedStaff.role}</span>
            {selectedStaff.department && <span>{selectedStaff.department}</span>}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearSelection}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 200);
        }}
        className="pl-9"
        disabled={disabled}
      />
      {isSearching && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="max-h-60 overflow-auto py-1">
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectStaff(user);
                }}
              >
                <div>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role}
                    {user.department ? ` - ${user.department}` : ''}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2 capitalize text-xs">
                  {user.role}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {showDropdown &&
        !isSearching &&
        searchQuery.length >= 2 &&
        results.length === 0 && (
          <div className="absolute z-[100] mt-1 w-full rounded-md border bg-popover p-3 shadow-lg">
            <p className="text-sm text-muted-foreground text-center">
              No staff found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
    </div>
  );
}
