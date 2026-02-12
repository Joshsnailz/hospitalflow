'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { clinicalApi } from '@/lib/api/clinical';
import type {
  ControlledDrugEntry,
  DrugSchedule,
  DrugEntryType,
  CreateControlledDrugEntryDto,
} from '@/lib/types/clinical';
import { Loader2, Pill, Plus, RefreshCw } from 'lucide-react';
import { PatientSearchInput } from '@/components/shared/patient-search-input';
import { StaffSearchInput } from '@/components/shared/staff-search-input';
import { SnomedSearchInput } from '@/components/shared/snomed-search-input';
import { Combobox } from '@/components/ui/combobox';
import { DRUG_UNITS } from '@/lib/data/drug-units';

const SCHEDULE_LABELS: Record<DrugSchedule, string> = {
  schedule_2: 'Schedule 2',
  schedule_3: 'Schedule 3',
  schedule_4: 'Schedule 4',
  schedule_5: 'Schedule 5',
};

const ENTRY_TYPE_LABELS: Record<DrugEntryType, string> = {
  administration: 'Administration',
  receipt: 'Receipt',
  disposal: 'Disposal',
  transfer: 'Transfer',
};

const SCHEDULE_OPTIONS: { value: DrugSchedule; label: string }[] = [
  { value: 'schedule_2', label: 'Schedule 2' },
  { value: 'schedule_3', label: 'Schedule 3' },
  { value: 'schedule_4', label: 'Schedule 4' },
  { value: 'schedule_5', label: 'Schedule 5' },
];

const ENTRY_TYPE_OPTIONS: { value: DrugEntryType; label: string }[] = [
  { value: 'administration', label: 'Administration' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'disposal', label: 'Disposal' },
  { value: 'transfer', label: 'Transfer' },
];

function getEntryTypeBadge(entryType: DrugEntryType) {
  switch (entryType) {
    case 'administration':
      return <Badge variant="info">{ENTRY_TYPE_LABELS[entryType]}</Badge>;
    case 'receipt':
      return <Badge variant="success">{ENTRY_TYPE_LABELS[entryType]}</Badge>;
    case 'disposal':
      return <Badge variant="destructive">{ENTRY_TYPE_LABELS[entryType]}</Badge>;
    case 'transfer':
      return <Badge variant="warning">{ENTRY_TYPE_LABELS[entryType]}</Badge>;
    default:
      return <Badge variant="secondary">{entryType}</Badge>;
  }
}

function getScheduleBadge(schedule: DrugSchedule) {
  switch (schedule) {
    case 'schedule_2':
      return <Badge variant="destructive">{SCHEDULE_LABELS[schedule]}</Badge>;
    case 'schedule_3':
      return <Badge className="border-transparent bg-orange-100 text-orange-700">{SCHEDULE_LABELS[schedule]}</Badge>;
    case 'schedule_4':
      return <Badge variant="warning">{SCHEDULE_LABELS[schedule]}</Badge>;
    case 'schedule_5':
      return <Badge variant="secondary">{SCHEDULE_LABELS[schedule]}</Badge>;
    default:
      return <Badge variant="secondary">{schedule}</Badge>;
  }
}

interface DrugForm {
  drugName: string;
  drugSchedule: DrugSchedule | '';
  batchNumber: string;
  entryType: DrugEntryType | '';
  quantity: string;
  unit: string;
  balanceAfter: string;
  patientId: string;
  witnessedBy: string;
  prescribedBy: string;
  reason: string;
  notes: string;
}

const initialFormState: DrugForm = {
  drugName: '',
  drugSchedule: '',
  batchNumber: '',
  entryType: '',
  quantity: '',
  unit: '',
  balanceAfter: '',
  patientId: '',
  witnessedBy: '',
  prescribedBy: '',
  reason: '',
  notes: '',
};

export default function ControlledDrugsPage() {
  const [entries, setEntries] = useState<ControlledDrugEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DrugForm>(initialFormState);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clinicalApi.getControlledDrugEntries();
      setEntries(response.data || []);
    } catch (err) {
      console.error('Failed to fetch controlled drug entries:', err);
      setError('Failed to load controlled drug register. Please try again.');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof DrugForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const validateForm = (): boolean => {
    if (!formData.drugName.trim()) {
      setFormError('Drug name is required');
      return false;
    }
    if (!formData.drugSchedule) {
      setFormError('Drug schedule is required');
      return false;
    }
    if (!formData.entryType) {
      setFormError('Entry type is required');
      return false;
    }
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      setFormError('A valid quantity is required');
      return false;
    }
    if (!formData.unit.trim()) {
      setFormError('Unit is required');
      return false;
    }
    if (formData.balanceAfter === '' || isNaN(Number(formData.balanceAfter))) {
      setFormError('A valid balance is required');
      return false;
    }
    if (formData.entryType === 'administration' && !formData.patientId.trim()) {
      setFormError('Patient ID is required for administration entries');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const createData: CreateControlledDrugEntryDto = {
        drugName: formData.drugName.trim(),
        drugSchedule: formData.drugSchedule as DrugSchedule,
        batchNumber: formData.batchNumber.trim() || undefined,
        entryType: formData.entryType as DrugEntryType,
        quantity: Number(formData.quantity),
        unit: formData.unit.trim(),
        balanceAfter: Number(formData.balanceAfter),
        patientId: formData.patientId.trim() || undefined,
        witnessedBy: formData.witnessedBy.trim() || undefined,
        prescribedBy: formData.prescribedBy.trim() || undefined,
        reason: formData.reason.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await clinicalApi.createControlledDrugEntry(createData);
      setIsDialogOpen(false);
      setFormData(initialFormState);
      fetchEntries();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create controlled drug entry';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormState);
    setFormError('');
  };

  const filteredEntries = entries.filter(entry => {
    if (scheduleFilter !== 'all' && entry.drugSchedule !== scheduleFilter) return false;
    if (entryTypeFilter !== 'all' && entry.entryType !== entryTypeFilter) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controlled Drugs Register</h1>
          <p className="text-muted-foreground">
            Auditable register of all controlled drug entries
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setIsDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Controlled Drug Entry</DialogTitle>
              <DialogDescription>
                Record a new controlled drug entry in the register.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Drug Name *</Label>
                  <SnomedSearchInput
                    value={formData.drugName}
                    onValueChange={(value) => handleInputChange('drugName', value)}
                    searchType="drugs"
                    allowFreeText
                    placeholder="Search medications..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drugSchedule">Schedule *</Label>
                  <Select
                    value={formData.drugSchedule}
                    onValueChange={(value) => handleInputChange('drugSchedule', value)}
                  >
                    <SelectTrigger id="drugSchedule">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    placeholder="Batch / Lot number"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryType">Entry Type *</Label>
                  <Select
                    value={formData.entryType}
                    onValueChange={(value) => handleInputChange('entryType', value)}
                  >
                    <SelectTrigger id="entryType">
                      <SelectValue placeholder="Select entry type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTRY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Combobox
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange('unit', value)}
                    options={DRUG_UNITS}
                    allowFreeText
                    placeholder="Select unit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balanceAfter">Balance After *</Label>
                  <Input
                    id="balanceAfter"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.balanceAfter}
                    onChange={(e) => handleInputChange('balanceAfter', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Patient {formData.entryType === 'administration' ? '*' : '(optional)'}
                </Label>
                <PatientSearchInput
                  value={formData.patientId}
                  onValueChange={(value) => handleInputChange('patientId', value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Witnessed By</Label>
                  <StaffSearchInput
                    value={formData.witnessedBy}
                    onValueChange={(value) => handleInputChange('witnessedBy', value)}
                    placeholder="Search staff..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prescribed By</Label>
                  <StaffSearchInput
                    value={formData.prescribedBy}
                    onValueChange={(value) => handleInputChange('prescribedBy', value)}
                    role="doctor"
                    placeholder="Search doctors..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  placeholder="Reason for entry"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes (optional)"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                />
              </div>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Entry'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Drug Register
          </CardTitle>
          <CardDescription>
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Schedule</Label>
              <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Schedules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schedules</SelectItem>
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Entry Type</Label>
              <Select value={entryTypeFilter} onValueChange={setEntryTypeFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ENTRY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto self-end">
              <Button variant="outline" size="icon" onClick={fetchEntries} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={fetchEntries}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {entries.length === 0
                ? 'No controlled drug entries recorded yet.'
                : 'No entries match your current filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Entry Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Administered By</TableHead>
                    <TableHead>Witnessed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{entry.drugName}</TableCell>
                      <TableCell>{getScheduleBadge(entry.drugSchedule)}</TableCell>
                      <TableCell>{getEntryTypeBadge(entry.entryType)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.quantity} {entry.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.balanceAfter} {entry.unit}
                      </TableCell>
                      <TableCell>
                        {entry.patientName || entry.patientId || '--'}
                        {entry.patientChiNumber && (
                          <span className="block text-xs text-muted-foreground">
                            CHI: {entry.patientChiNumber}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{entry.administeredByName || entry.administeredBy || '--'}</TableCell>
                      <TableCell>{entry.witnessedByName || entry.witnessedBy || '--'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
