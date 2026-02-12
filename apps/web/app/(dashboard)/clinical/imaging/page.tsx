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
  ImagingRequest,
  ImagingStatus,
  ImagingType,
  ImagingPriority,
  CreateImagingRequestDto,
} from '@/lib/types/clinical';
import { Loader2, ImageIcon, Plus, RefreshCw } from 'lucide-react';
import { PatientSearchInput } from '@/components/shared/patient-search-input';
import { Combobox } from '@/components/ui/combobox';
import { BODY_PARTS } from '@/lib/data/body-parts';

const IMAGING_TYPE_LABELS: Record<ImagingType, string> = {
  xray: 'X-ray',
  ct_scan: 'CT Scan',
  mri: 'MRI',
  ultrasound: 'Ultrasound',
  fluoroscopy: 'Fluoroscopy',
  mammography: 'Mammography',
  pet_scan: 'PET Scan',
  other: 'Other',
};

const STATUS_OPTIONS: { value: ImagingStatus; label: string }[] = [
  { value: 'requested', label: 'Requested' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS: { value: ImagingPriority; label: string }[] = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'stat', label: 'STAT' },
];

function getStatusBadge(status: ImagingStatus) {
  switch (status) {
    case 'requested':
      return <Badge variant="warning">{status}</Badge>;
    case 'scheduled':
      return <Badge variant="info">{status}</Badge>;
    case 'in_progress':
      return <Badge className="border-transparent bg-orange-100 text-orange-700">In Progress</Badge>;
    case 'completed':
      return <Badge variant="success">{status}</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getPriorityBadge(priority: ImagingPriority) {
  switch (priority) {
    case 'routine':
      return <Badge variant="secondary">{priority}</Badge>;
    case 'urgent':
      return <Badge className="border-transparent bg-orange-100 text-orange-700">{priority}</Badge>;
    case 'stat':
      return <Badge variant="destructive">STAT</Badge>;
    default:
      return <Badge variant="secondary">{priority}</Badge>;
  }
}

interface ImagingForm {
  patientId: string;
  imagingType: ImagingType | '';
  bodyPart: string;
  clinicalIndication: string;
  priority: ImagingPriority;
  scheduledDate: string;
  notes: string;
}

const initialFormState: ImagingForm = {
  patientId: '',
  imagingType: '',
  bodyPart: '',
  clinicalIndication: '',
  priority: 'routine',
  scheduledDate: '',
  notes: '',
};

export default function ClinicalImagingPage() {
  const [requests, setRequests] = useState<ImagingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ImagingForm>(initialFormState);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clinicalApi.getImagingRequests();
      setRequests(response.data || []);
    } catch (err) {
      console.error('Failed to fetch imaging requests:', err);
      setError('Failed to load imaging requests. Please try again.');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ImagingForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const validateForm = (): boolean => {
    if (!formData.patientId.trim()) {
      setFormError('Patient ID is required');
      return false;
    }
    if (!formData.imagingType) {
      setFormError('Imaging type is required');
      return false;
    }
    if (!formData.bodyPart.trim()) {
      setFormError('Body part is required');
      return false;
    }
    if (!formData.clinicalIndication.trim()) {
      setFormError('Clinical indication is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const createData: CreateImagingRequestDto = {
        patientId: formData.patientId.trim(),
        imagingType: formData.imagingType as ImagingType,
        bodyPart: formData.bodyPart.trim(),
        clinicalIndication: formData.clinicalIndication.trim(),
        priority: formData.priority,
        scheduledDate: formData.scheduledDate || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await clinicalApi.createImagingRequest(createData);
      setIsDialogOpen(false);
      setFormData(initialFormState);
      fetchRequests();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create imaging request';
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

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;
    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Imaging</h1>
          <p className="text-muted-foreground">
            Manage imaging requests, track status, and view results
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setIsDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Imaging Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>New Imaging Request</DialogTitle>
              <DialogDescription>
                Submit a new imaging request for a patient.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <PatientSearchInput
                  value={formData.patientId}
                  onValueChange={(value) => handleInputChange('patientId', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagingType">Imaging Type *</Label>
                <Select
                  value={formData.imagingType}
                  onValueChange={(value) => handleInputChange('imagingType', value)}
                >
                  <SelectTrigger id="imagingType">
                    <SelectValue placeholder="Select imaging type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMAGING_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Body Part *</Label>
                <Combobox
                  value={formData.bodyPart}
                  onValueChange={(value) => handleInputChange('bodyPart', value)}
                  options={BODY_PARTS}
                  allowFreeText
                  placeholder="Select body part"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicalIndication">Clinical Indication *</Label>
                <Textarea
                  id="clinicalIndication"
                  placeholder="Reason for imaging request"
                  value={formData.clinicalIndication}
                  onChange={(e) => handleInputChange('clinicalIndication', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
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
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imaging Requests
          </CardTitle>
          <CardDescription>
            {requests.length} request{requests.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto self-end">
              <Button variant="outline" size="icon" onClick={fetchRequests} disabled={isLoading}>
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
              <Button variant="outline" onClick={fetchRequests}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {requests.length === 0
                ? 'No imaging requests yet. Create your first request to get started.'
                : 'No imaging requests match your current filters.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Body Part</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {req.patientName || req.patientId}
                      {req.patientChiNumber && (
                        <span className="block text-xs text-muted-foreground">
                          CHI: {req.patientChiNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{IMAGING_TYPE_LABELS[req.imagingType] || req.imagingType}</TableCell>
                    <TableCell>{req.bodyPart}</TableCell>
                    <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>{formatDate(req.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
