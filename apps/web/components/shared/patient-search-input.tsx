'use client';

import { useState, useCallback, useRef } from 'react';
import { patientsApi } from '@/lib/api/patients';
import type { Patient } from '@/lib/types/patient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, X } from 'lucide-react';

interface PatientSearchInputProps {
  value: string; // patientId
  onValueChange: (patientId: string) => void;
  onPatientSelect?: (patient: Patient | null) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function PatientSearchInput({
  value,
  onValueChange,
  onPatientSelect,
  required = false,
  disabled = false,
  placeholder = 'Type patient name or CHI number to search...',
}: PatientSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      setIsSearching(true);
      const response = await patientsApi.findAll({ search: query, limit: 10 });
      if (response.success) {
        setResults(response.data);
        setShowDropdown(true);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (selectedPatient) {
      setSelectedPatient(null);
      onValueChange('');
      onPatientSelect?.(null);
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchPatients(val);
    }, 300);
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setShowDropdown(false);
    setResults([]);
    onValueChange(patient.id);
    onPatientSelect?.(patient);
  };

  const clearSelection = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setResults([]);
    setShowDropdown(false);
    onValueChange('');
    onPatientSelect?.(null);
    inputRef.current?.focus();
  };

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
        <div>
          <p className="font-medium text-sm">
            {selectedPatient.firstName} {selectedPatient.lastName}
          </p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-mono">{selectedPatient.chiNumber}</span>
            <span>
              DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString('en-GB')}
            </span>
            <span className="capitalize">{selectedPatient.gender}</span>
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
            {results.map((patient) => (
              <button
                key={patient.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectPatient(patient);
                }}
              >
                <div>
                  <p className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CHI: {patient.chiNumber} | DOB:{' '}
                    {new Date(patient.dateOfBirth).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2 capitalize text-xs">
                  {patient.gender}
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
              No patients found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
    </div>
  );
}
