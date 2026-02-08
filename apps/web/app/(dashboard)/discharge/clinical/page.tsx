'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clinicalApi } from '@/lib/api/clinical';
import { patientsApi } from '@/lib/api/patients';
import type { Patient } from '@/lib/types/patient';
import type { DischargeForm, DischargeStatus } from '@/lib/types/clinical';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Eye,
  CheckCircle,
  RefreshCw,
  ClipboardList,
  Search,
} from 'lucide-react';

const STATUS_OPTIONS: { value: DischargeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function getStatusBadge(status: DischargeStatus) {
  switch (status) {
    case 'active':
      return <Badge variant="info">{status}</Badge>;
    case 'pending_review':
      return <Badge variant="warning">pending review</Badge>;
    case 'completed':
      return <Badge variant="success">{status}</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ClinicalDischargePage() {
  const router = useRouter();
  const [forms, setForms] = useState<DischargeForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<DischargeStatus | 'all'>('active');

  // Complete Discharge dialog
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<DischargeForm | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // New Discharge Form dialog
  const [newFormDialogOpen, setNewFormDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFormData, setNewFormData] = useState({
    patientSearch: '',
    patientId: '',
    patientName: '',
    admissionDate: '',
    primaryDiagnosis: '',
  });
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetchForms();
  }, [statusFilter]);

  const fetchForms = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, any> = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await clinicalApi.getDischargeForms(params);
      setForms(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load discharge forms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteDischarge = async () => {
    if (!selectedForm) return;
    setIsCompleting(true);
    try {
      await clinicalApi.completeDischarge(selectedForm.id);
      setCompleteDialogOpen(false);
      setSelectedForm(null);
      fetchForms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete discharge');
    } finally {
      setIsCompleting(false);
    }
  };

  const openCompleteDialog = (form: DischargeForm) => {
    setSelectedForm(form);
    setCompleteDialogOpen(true);
  };

  const handleCreateForm = async () => {
    if (!newFormData.patientId || !newFormData.admissionDate || !newFormData.primaryDiagnosis.trim()) {
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (newFormData.admissionDate > today) {
      setError('Admission date cannot be in the future');
      return;
    }
    setIsCreating(true);
    try {
      await clinicalApi.createDischargeForm({
        patientId: newFormData.patientId,
        dischargeDiagnosis: newFormData.primaryDiagnosis.trim(),
      });
      setNewFormDialogOpen(false);
      setNewFormData({
        patientSearch: '',
        patientId: '',
        patientName: '',
        admissionDate: '',
        primaryDiagnosis: '',
      });
      fetchForms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create discharge form');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePatientSearch = useCallback((value: string) => {
    setNewFormData((prev) => ({ ...prev, patientSearch: value, patientId: '', patientName: '' }));
    setShowPatientDropdown(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value.trim()) {
      setPatientSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setPatientSearchLoading(true);
      try {
        const res = await patientsApi.findAll({ search: value, limit: 8 });
        setPatientSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setPatientSearchResults([]);
      } finally {
        setPatientSearchLoading(false);
      }
    }, 350);
  }, []);

  const selectPatient = (patient: Patient) => {
    setNewFormData((prev) => ({
      ...prev,
      patientSearch: `${patient.firstName} ${patient.lastName} (${patient.chiNumber})`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
    }));
    setPatientSearchResults([]);
    setShowPatientDropdown(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Clinical Discharge List
          </h1>
          <p className="text-muted-foreground">
            Manage patient discharge forms and complete clinical discharge reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchForms}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setNewFormDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Discharge Form
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchForms}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-[200px]">
              <Label htmlFor="status-filter" className="text-sm font-medium mb-1 block">
                Filter by Status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as DischargeStatus | 'all')}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              {forms.length} discharge form{forms.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No discharge forms found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>CHI Number</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead>Primary Diagnosis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">
                      {form.patientName || '--'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {form.patientChi || form.patientChiNumber || '--'}
                    </TableCell>
                    <TableCell>{formatDate(form.admissionDate)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {form.primaryDiagnosis || '--'}
                    </TableCell>
                    <TableCell>{getStatusBadge(form.status)}</TableCell>
                    <TableCell>{formatDateTime(form.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/discharge/${form.id}`)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        {form.status === 'active' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openCompleteDialog(form)}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Complete Discharge Confirmation Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Discharge</DialogTitle>
            <DialogDescription>
              Are you sure you want to complete the discharge for{' '}
              <span className="font-semibold">{selectedForm?.patientName}</span>?
              This action will mark the discharge form as completed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient:</span>
              <span className="font-medium">{selectedForm?.patientName || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CHI Number:</span>
              <span className="font-mono">{selectedForm?.patientChi || selectedForm?.patientChiNumber || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary Diagnosis:</span>
              <span className="font-medium">{selectedForm?.primaryDiagnosis || '--'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button onClick={handleCompleteDischarge} disabled={isCompleting}>
              {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Discharge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Discharge Form Dialog */}
      <Dialog open={newFormDialogOpen} onOpenChange={setNewFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Discharge Form</DialogTitle>
            <DialogDescription>
              Search for a patient and fill in the required details to create a new discharge form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-search">Patient *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="patient-search"
                  placeholder="Search by name or CHI number..."
                  value={newFormData.patientSearch}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                  className="pl-9"
                  autoComplete="off"
                />
                {patientSearchLoading && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {showPatientDropdown && patientSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {patientSearchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex flex-col"
                        onMouseDown={() => selectPatient(p)}
                      >
                        <span className="font-medium">{p.firstName} {p.lastName}</span>
                        <span className="text-muted-foreground">{p.chiNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {newFormData.patientId && (
                <p className="text-xs text-green-600">Patient selected ✓</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admission-date">Admission Date</Label>
              <Input
                id="admission-date"
                type="date"
                value={newFormData.admissionDate}
                onChange={(e) =>
                  setNewFormData((prev) => ({ ...prev, admissionDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary-diagnosis">Primary Diagnosis</Label>
              <Textarea
                id="primary-diagnosis"
                placeholder="Enter the primary diagnosis..."
                value={newFormData.primaryDiagnosis}
                onChange={(e) =>
                  setNewFormData((prev) => ({ ...prev, primaryDiagnosis: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewFormDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateForm}
              disabled={
                isCreating ||
                !newFormData.patientId ||
                !newFormData.admissionDate ||
                !newFormData.primaryDiagnosis.trim()
              }
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
