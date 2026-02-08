'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { patientsApi } from '@/lib/api/patients';
import type { Patient, PatientFilterDto } from '@/lib/types/patient';
import { Loader2, Search, Eye, RotateCcw, Filter, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SearchFilters {
  chiNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

const initialFilters: SearchFilters = {
  chiNumber: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
};

const MAX_RESULTS = 20;

export default function PatientSearchPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [validationError, setValidationError] = useState('');

  // Check if all search fields are filled
  const allFieldsFilled =
    filters.chiNumber.trim() !== '' &&
    filters.firstName.trim() !== '' &&
    filters.lastName.trim() !== '' &&
    filters.dateOfBirth.trim() !== '';

  // Count how many search parameters are filled
  const filledFiltersCount = Object.values(filters).filter(v => v.trim() !== '').length;

  // Calculate match score for a patient based on search criteria
  const calculateMatchScore = (patient: Patient): number => {
    let score = 0;
    const chiSearch = filters.chiNumber.trim().toUpperCase();
    const firstNameSearch = filters.firstName.trim().toLowerCase();
    const lastNameSearch = filters.lastName.trim().toLowerCase();
    const dobSearch = filters.dateOfBirth;

    // CHI number match (exact match = highest priority)
    if (chiSearch && patient.chiNumber) {
      if (patient.chiNumber.toUpperCase() === chiSearch) {
        score += 100; // Exact match
      } else if (patient.chiNumber.toUpperCase().includes(chiSearch)) {
        score += 50; // Partial match
      }
    }

    // First name match
    if (firstNameSearch && patient.firstName) {
      const patientFirstName = patient.firstName.toLowerCase();
      if (patientFirstName === firstNameSearch) {
        score += 40; // Exact match
      } else if (patientFirstName.startsWith(firstNameSearch)) {
        score += 30; // Starts with
      } else if (patientFirstName.includes(firstNameSearch)) {
        score += 20; // Contains
      }
    }

    // Last name match
    if (lastNameSearch && patient.lastName) {
      const patientLastName = patient.lastName.toLowerCase();
      if (patientLastName === lastNameSearch) {
        score += 40; // Exact match
      } else if (patientLastName.startsWith(lastNameSearch)) {
        score += 30; // Starts with
      } else if (patientLastName.includes(lastNameSearch)) {
        score += 20; // Contains
      }
    }

    // Date of birth match (exact match only)
    if (dobSearch && patient.dateOfBirth) {
      const patientDob = patient.dateOfBirth.split('T')[0];
      if (patientDob === dobSearch) {
        score += 50; // Exact match
      }
    }

    return score;
  };

  const handleSearch = async () => {
    // Validate all parameters are filled
    if (!allFieldsFilled) {
      setValidationError('Please fill in all search fields (CHI Number, First Name, Last Name, and Date of Birth)');
      return;
    }

    setValidationError('');
    setIsLoading(true);
    setHasSearched(true);

    try {
      // Build search query from filters
      const searchParams: PatientFilterDto = {
        limit: 100, // Fetch more to allow client-side ranking
        sortBy: 'lastName',
        sortOrder: 'ASC',
      };

      // Add CHI number filter (partial match)
      if (filters.chiNumber.trim()) {
        searchParams.chiNumber = filters.chiNumber.trim().toUpperCase();
      }

      // Build search string for name
      const searchParts: string[] = [];
      if (filters.firstName.trim()) {
        searchParts.push(filters.firstName.trim());
      }
      if (filters.lastName.trim()) {
        searchParts.push(filters.lastName.trim());
      }
      if (searchParts.length > 0) {
        searchParams.search = searchParts.join(' ');
      }

      // Add date of birth filter
      if (filters.dateOfBirth) {
        searchParams.dateOfBirthFrom = filters.dateOfBirth;
        searchParams.dateOfBirthTo = filters.dateOfBirth;
      }

      const response = await patientsApi.findAll(searchParams);

      // Score and rank results by match quality
      const scoredResults = response.data
        .map(patient => ({
          patient,
          score: calculateMatchScore(patient),
        }))
        .filter(item => item.score > 0) // Only include patients with at least one match
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .slice(0, MAX_RESULTS) // Limit to 20 results
        .map(item => item.patient);

      setPatients(scoredResults);
      setTotalResults(scoredResults.length);
    } catch (error) {
      console.error('Search failed:', error);
      setPatients([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setPatients([]);
    setHasSearched(false);
    setTotalResults(0);
    setValidationError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patient Search</h1>
        <p className="text-muted-foreground">
          Search for patients using multiple criteria
        </p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Criteria
          </CardTitle>
          <CardDescription>
            All fields are required to search for patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onKeyPress={handleKeyPress}>
            {/* CHI Number */}
            <div className="space-y-2">
              <Label htmlFor="chiNumber">CHI Number</Label>
              <Input
                id="chiNumber"
                placeholder="e.g., 70282487G70"
                value={filters.chiNumber}
                onChange={(e) => {
                  setFilters({ ...filters, chiNumber: e.target.value.toUpperCase() });
                  setValidationError('');
                }}
                className="font-mono uppercase"
              />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="e.g., John"
                value={filters.firstName}
                onChange={(e) => {
                  setFilters({ ...filters, firstName: e.target.value });
                  setValidationError('');
                }}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="e.g., Smith"
                value={filters.lastName}
                onChange={(e) => {
                  setFilters({ ...filters, lastName: e.target.value });
                  setValidationError('');
                }}
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={filters.dateOfBirth}
                onChange={(e) => {
                  setFilters({ ...filters, dateOfBirth: e.target.value });
                  setValidationError('');
                }}
              />
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSearch} disabled={isLoading || !allFieldsFilled}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
          {filledFiltersCount > 0 && !allFieldsFilled && (
            <p className="text-sm text-muted-foreground mt-2">
              {filledFiltersCount} of 4 fields filled. All fields are required to search.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>
              Search Results ({totalResults})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No patients found matching your search criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CHI Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono">{patient.chiNumber}</TableCell>
                      <TableCell className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>{formatDate(patient.dateOfBirth)}</TableCell>
                      <TableCell>{calculateAge(patient.dateOfBirth)}</TableCell>
                      <TableCell className="capitalize">{patient.gender}</TableCell>
                      <TableCell>{patient.city || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={patient.isActive ? 'default' : 'secondary'}>
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/patients/${patient.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
