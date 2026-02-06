'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { clinicalApi } from '@/lib/api/clinical';
import { hospitalsApi } from '@/lib/api/hospitals';
import type {
  EmergencyVisit,
  TriageCategory,
  EmergencyStatus,
  CreateEmergencyVisitDto,
} from '@/lib/types/clinical';
import type { Hospital, Department, Ward, Bed } from '@/lib/types/hospital';
import { Loader2, Ambulance, Plus, RefreshCw, Clock, Stethoscope, ClipboardList, AlertCircle } from 'lucide-react';

const TRIAGE_CONFIG: Record<TriageCategory, { label: string; color: string; bgColor: string; borderColor: string; description: string }> = {
  red: {
    label: 'Red - Immediate',
    color: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    description: 'Life-threatening, requires immediate treatment',
  },
  orange: {
    label: 'Orange - Very Urgent',
    color: 'text-orange-800',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    description: 'Serious condition, to be seen within 10 minutes',
  },
  yellow: {
    label: 'Yellow - Urgent',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    description: 'Urgent but stable, to be seen within 60 minutes',
  },
  green: {
    label: 'Green - Standard',
    color: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    description: 'Less urgent, can wait for assessment',
  },
  blue: {
    label: 'Blue - Non-Urgent',
    color: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    description: 'Non-urgent, suitable for primary care',
  },
};

const TRIAGE_ORDER: TriageCategory[] = ['red', 'orange', 'yellow', 'green', 'blue'];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'triaged', label: 'Triaged' },
  { value: 'being_seen', label: 'Being Seen' },
  { value: 'in_treatment', label: 'In Treatment' },
  { value: 'observation', label: 'Observation' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'discharged', label: 'Discharged' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'deceased', label: 'Deceased' },
];

const ARRIVAL_MODE_OPTIONS = [
  { value: 'ambulance', label: 'Ambulance' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'police', label: 'Police' },
  { value: 'transfer', label: 'Transfer' },
];

function getStatusBadge(status: EmergencyStatus | string) {
  switch (status) {
    case 'triaged':
      return <Badge variant="warning">Triaged</Badge>;
    case 'being_seen':
      return <Badge className="border-transparent bg-purple-100 text-purple-700">Being Seen</Badge>;
    case 'in_treatment':
      return <Badge className="border-transparent bg-orange-100 text-orange-700">In Treatment</Badge>;
    case 'observation':
      return <Badge variant="info">Observation</Badge>;
    case 'admitted':
      return <Badge variant="default">Admitted</Badge>;
    case 'discharged':
      return <Badge variant="success">Discharged</Badge>;
    case 'transferred':
      return <Badge variant="secondary">Transferred</Badge>;
    case 'deceased':
      return <Badge variant="destructive">Deceased</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

const DISPOSITION_OPTIONS = [
  { value: 'admitted', label: 'Admit' },
  { value: 'discharged', label: 'Discharge Home' },
  { value: 'transferred', label: 'Transfer' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'left_ama', label: 'Left AMA' },
];

interface EmergencyForm {
  patientId: string;
  triageCategory: TriageCategory | '';
  chiefComplaint: string;
  arrivalMode: string;
  arrivalTime: string;
  vitalsHeartRate: string;
  vitalsBP: string;
  vitalsTemp: string;
  vitalsRespRate: string;
  vitalsSpO2: string;
  notes: string;
}

const initialFormState: EmergencyForm = {
  patientId: '',
  triageCategory: '',
  chiefComplaint: '',
  arrivalMode: 'walk_in',
  arrivalTime: new Date().toISOString().slice(0, 16),
  vitalsHeartRate: '',
  vitalsBP: '',
  vitalsTemp: '',
  vitalsRespRate: '',
  vitalsSpO2: '',
  notes: '',
};

export default function EmergencyCarePage() {
  const [visits, setVisits] = useState<EmergencyVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EmergencyForm>(initialFormState);
  const [formError, setFormError] = useState('');

  // Toast-like feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // See Patient loading state (per-visit)
  const [seePatientLoadingId, setSeePatientLoadingId] = useState<string | null>(null);

  // Disposition dialog
  const [selectedVisit, setSelectedVisit] = useState<EmergencyVisit | null>(null);
  const [dispositionDialogOpen, setDispositionDialogOpen] = useState(false);
  const [dispositionLoading, setDispositionLoading] = useState(false);
  const [dispositionValue, setDispositionValue] = useState('');
  const [dispositionNotes, setDispositionNotes] = useState('');
  const [dispositionAdmittingDoctorId, setDispositionAdmittingDoctorId] = useState('');
  const [dispositionAdmissionDiagnosis, setDispositionAdmissionDiagnosis] = useState('');

  // Cascading selects for admission
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [bedsLoading, setBedsLoading] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clinicalApi.getEmergencyVisits();
      setVisits(response.data || []);
    } catch (err) {
      console.error('Failed to fetch emergency visits:', err);
      setError('Failed to load emergency visits. Please try again.');
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof EmergencyForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const validateForm = (): boolean => {
    if (!formData.patientId.trim()) {
      setFormError('Patient ID is required');
      return false;
    }
    if (!formData.triageCategory) {
      setFormError('Triage category is required');
      return false;
    }
    if (!formData.chiefComplaint.trim()) {
      setFormError('Chief complaint is required');
      return false;
    }
    if (!formData.arrivalTime) {
      setFormError('Arrival time is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const vitals: Record<string, any> = {};
      if (formData.vitalsHeartRate) vitals.heartRate = Number(formData.vitalsHeartRate);
      if (formData.vitalsBP) vitals.bloodPressure = formData.vitalsBP;
      if (formData.vitalsTemp) vitals.temperature = Number(formData.vitalsTemp);
      if (formData.vitalsRespRate) vitals.respiratoryRate = Number(formData.vitalsRespRate);
      if (formData.vitalsSpO2) vitals.spO2 = Number(formData.vitalsSpO2);

      const createData: CreateEmergencyVisitDto = {
        patientId: formData.patientId.trim(),
        triageCategory: formData.triageCategory as TriageCategory,
        chiefComplaint: formData.chiefComplaint.trim(),
        arrivalMode: formData.arrivalMode || undefined,
        arrivalTime: new Date(formData.arrivalTime).toISOString(),
        vitals: Object.keys(vitals).length > 0 ? vitals : undefined,
        notes: formData.notes.trim() || undefined,
      };

      await clinicalApi.createEmergencyVisit(createData);
      setIsDialogOpen(false);
      setFormData({
        ...initialFormState,
        arrivalTime: new Date().toISOString().slice(0, 16),
      });
      fetchVisits();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to register emergency visit';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      ...initialFormState,
      arrivalTime: new Date().toISOString().slice(0, 16),
    });
    setFormError('');
  };

  // -- See Patient & Disposition actions ----------------------------------------

  const handleSeePatient = async (visit: EmergencyVisit) => {
    try {
      setSeePatientLoadingId(visit.id);
      await clinicalApi.updateEmergencyVisit(visit.id, { status: 'being_seen' });
      showToast('success', `Now seeing patient ${visit.patientName || visit.patientId}`);
      fetchVisits();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to update visit status');
    } finally {
      setSeePatientLoadingId(null);
    }
  };

  const openDispositionDialog = (visit: EmergencyVisit) => {
    setSelectedVisit(visit);
    setDispositionValue('');
    setDispositionNotes('');
    setDispositionAdmittingDoctorId('');
    setDispositionAdmissionDiagnosis('');
    setSelectedHospitalId('');
    setSelectedDepartmentId('');
    setSelectedWardId('');
    setSelectedBedId('');
    setDepartments([]);
    setWards([]);
    setAvailableBeds([]);
    setDispositionDialogOpen(true);
    fetchHospitals();
  };

  const fetchHospitals = async () => {
    try {
      setHospitalsLoading(true);
      const response = await hospitalsApi.findAll();
      if (response.success) {
        setHospitals(response.data);
      }
    } catch {
      // Non-critical
    } finally {
      setHospitalsLoading(false);
    }
  };

  const handleHospitalChange = async (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setSelectedDepartmentId('');
    setSelectedWardId('');
    setSelectedBedId('');
    setDepartments([]);
    setWards([]);
    setAvailableBeds([]);
    if (!hospitalId) return;
    try {
      setDepartmentsLoading(true);
      const response = await hospitalsApi.getDepartments(hospitalId);
      if (response.success) {
        setDepartments(response.data);
      }
    } catch {
      // Non-critical
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleDepartmentChange = async (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedWardId('');
    setSelectedBedId('');
    setWards([]);
    setAvailableBeds([]);
    if (!departmentId || !selectedHospitalId) return;
    try {
      setWardsLoading(true);
      const response = await hospitalsApi.getWards(selectedHospitalId, departmentId);
      if (response.success) {
        setWards(response.data);
      }
    } catch {
      // Non-critical
    } finally {
      setWardsLoading(false);
    }
  };

  const handleWardChange = async (wardId: string) => {
    setSelectedWardId(wardId);
    setSelectedBedId('');
    setAvailableBeds([]);
    if (!wardId) return;
    try {
      setBedsLoading(true);
      const response = await hospitalsApi.getAvailableBeds({ wardId });
      if (response.success) {
        setAvailableBeds(response.data);
      }
    } catch {
      // Non-critical
    } finally {
      setBedsLoading(false);
    }
  };

  const handleDisposition = async () => {
    if (!selectedVisit || !dispositionValue) return;
    try {
      setDispositionLoading(true);
      const payload: Record<string, any> = {
        disposition: dispositionValue,
        notes: dispositionNotes || undefined,
      };
      if (dispositionValue === 'admitted') {
        payload.hospitalId = selectedHospitalId || undefined;
        payload.departmentId = selectedDepartmentId || undefined;
        payload.wardId = selectedWardId || undefined;
        payload.bedId = selectedBedId || undefined;
        payload.admittingDoctorId = dispositionAdmittingDoctorId || undefined;
        payload.admissionDiagnosis = dispositionAdmissionDiagnosis || undefined;
      }
      await clinicalApi.disposeEmergencyVisit(selectedVisit.id, payload);
      showToast('success', 'Disposition recorded successfully');
      setDispositionDialogOpen(false);
      fetchVisits();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to record disposition');
    } finally {
      setDispositionLoading(false);
    }
  };

  const filteredVisits = visits.filter(visit => {
    if (statusFilter !== 'all' && visit.status !== statusFilter) return false;
    return true;
  });

  const groupedVisits: Record<TriageCategory, EmergencyVisit[]> = {
    red: [],
    orange: [],
    yellow: [],
    green: [],
    blue: [],
  };

  filteredVisits.forEach(visit => {
    if (groupedVisits[visit.triageCategory]) {
      groupedVisits[visit.triageCategory].push(visit);
    }
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSinceArrival = (arrivalTime: string) => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diffMs = now.getTime() - arrival.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    if (diffHours < 24) return `${diffHours}h ${remainingMins}m ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h ago`;
  };

  const totalActive = filteredVisits.filter(v =>
    !['discharged', 'transferred', 'deceased'].includes(v.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] max-w-sm rounded-lg border px-4 py-3 shadow-lg transition-all ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <Ambulance className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Care</h1>
          <p className="text-muted-foreground">
            Triage board and emergency patient management
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setIsDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Plus className="mr-2 h-4 w-4" />
              Register Emergency
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Register Emergency Visit</DialogTitle>
              <DialogDescription>
                Register a new patient in the emergency department.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID *</Label>
                <Input
                  id="patientId"
                  placeholder="Search or enter patient ID"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="triageCategory">Triage Category *</Label>
                <Select
                  value={formData.triageCategory}
                  onValueChange={(value) => handleInputChange('triageCategory', value)}
                >
                  <SelectTrigger id="triageCategory">
                    <SelectValue placeholder="Select triage category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIAGE_ORDER.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {TRIAGE_CONFIG[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                <Textarea
                  id="chiefComplaint"
                  placeholder="Describe the chief complaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arrivalMode">Arrival Mode</Label>
                  <Select
                    value={formData.arrivalMode}
                    onValueChange={(value) => handleInputChange('arrivalMode', value)}
                  >
                    <SelectTrigger id="arrivalMode">
                      <SelectValue placeholder="Select arrival mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARRIVAL_MODE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time *</Label>
                  <Input
                    id="arrivalTime"
                    type="datetime-local"
                    value={formData.arrivalTime}
                    onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Initial Vitals</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="vitalsHeartRate" className="text-xs text-muted-foreground">
                      Heart Rate (bpm)
                    </Label>
                    <Input
                      id="vitalsHeartRate"
                      type="number"
                      placeholder="--"
                      value={formData.vitalsHeartRate}
                      onChange={(e) => handleInputChange('vitalsHeartRate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vitalsBP" className="text-xs text-muted-foreground">
                      Blood Pressure
                    </Label>
                    <Input
                      id="vitalsBP"
                      placeholder="120/80"
                      value={formData.vitalsBP}
                      onChange={(e) => handleInputChange('vitalsBP', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vitalsTemp" className="text-xs text-muted-foreground">
                      Temp (C)
                    </Label>
                    <Input
                      id="vitalsTemp"
                      type="number"
                      step="0.1"
                      placeholder="--"
                      value={formData.vitalsTemp}
                      onChange={(e) => handleInputChange('vitalsTemp', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vitalsRespRate" className="text-xs text-muted-foreground">
                      Resp Rate (/min)
                    </Label>
                    <Input
                      id="vitalsRespRate"
                      type="number"
                      placeholder="--"
                      value={formData.vitalsRespRate}
                      onChange={(e) => handleInputChange('vitalsRespRate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vitalsSpO2" className="text-xs text-muted-foreground">
                      SpO2 (%)
                    </Label>
                    <Input
                      id="vitalsSpO2"
                      type="number"
                      placeholder="--"
                      value={formData.vitalsSpO2}
                      onChange={(e) => handleInputChange('vitalsSpO2', e.target.value)}
                    />
                  </div>
                </div>
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
              <Button onClick={handleSubmit} disabled={isSubmitting} variant="destructive">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Emergency'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and summary */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
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
        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalActive}</span> active patient{totalActive !== 1 ? 's' : ''}
          </div>
          <Button variant="outline" size="icon" onClick={fetchVisits} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Triage Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={fetchVisits}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {visits.length === 0
            ? 'No emergency visits recorded. Register a new emergency to get started.'
            : 'No emergency visits match your current filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {TRIAGE_ORDER.map((category) => {
            const config = TRIAGE_CONFIG[category];
            const categoryVisits = groupedVisits[category];
            if (categoryVisits.length === 0) return null;

            return (
              <Card key={category} className={`border-2 ${config.borderColor}`}>
                <CardHeader className={`${config.bgColor} py-3`}>
                  <CardTitle className={`text-base flex items-center justify-between ${config.color}`}>
                    <div className="flex items-center gap-2">
                      <Ambulance className="h-4 w-4" />
                      {config.label}
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {categoryVisits.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categoryVisits.map((visit) => (
                      <Card key={visit.id} className="border shadow-sm">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm leading-tight">
                              {visit.patientName || visit.patientId}
                            </div>
                            {getStatusBadge(visit.status)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {visit.chiefComplaint}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(visit.arrivalTime)}
                            <span className="ml-1 font-medium">
                              ({getTimeSinceArrival(visit.arrivalTime)})
                            </span>
                          </div>
                          {visit.attendingDoctorName && (
                            <p className="text-xs text-muted-foreground">
                              Dr. {visit.attendingDoctorName}
                            </p>
                          )}
                          {/* Action buttons */}
                          <div className="flex items-center gap-1 pt-1">
                            {visit.status === 'triaged' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                disabled={seePatientLoadingId === visit.id}
                                onClick={() => handleSeePatient(visit)}
                              >
                                {seePatientLoadingId === visit.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Stethoscope className="h-3 w-3" />
                                )}
                                See Patient
                              </Button>
                            )}
                            {visit.status === 'in_treatment' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => openDispositionDialog(visit)}
                              >
                                <ClipboardList className="h-3 w-3" />
                                Disposition
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------- Disposition Dialog ---------- */}
      <Dialog open={dispositionDialogOpen} onOpenChange={setDispositionDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Patient Disposition</DialogTitle>
            <DialogDescription>
              Record the disposition for {selectedVisit?.patientName || selectedVisit?.patientId || 'this patient'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Disposition */}
            <div className="space-y-2">
              <Label>Disposition</Label>
              <Select value={dispositionValue} onValueChange={setDispositionValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select disposition" />
                </SelectTrigger>
                <SelectContent>
                  {DISPOSITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="disposition-notes">Notes</Label>
              <Textarea
                id="disposition-notes"
                placeholder="Disposition notes..."
                value={dispositionNotes}
                onChange={(e) => setDispositionNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Admission fields (only when disposition is 'admitted') */}
            {dispositionValue === 'admitted' && (
              <>
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Admission Details</p>

                {/* Admitting Doctor ID */}
                <div className="space-y-2">
                  <Label htmlFor="disposition-admitting-doctor">Admitting Doctor ID</Label>
                  <Input
                    id="disposition-admitting-doctor"
                    placeholder="Enter doctor ID..."
                    value={dispositionAdmittingDoctorId}
                    onChange={(e) => setDispositionAdmittingDoctorId(e.target.value)}
                  />
                </div>

                {/* Admission Diagnosis */}
                <div className="space-y-2">
                  <Label htmlFor="disposition-admission-diagnosis">Admission Diagnosis</Label>
                  <Textarea
                    id="disposition-admission-diagnosis"
                    placeholder="Admission diagnosis..."
                    value={dispositionAdmissionDiagnosis}
                    onChange={(e) => setDispositionAdmissionDiagnosis(e.target.value)}
                    rows={2}
                  />
                </div>

                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Bed Assignment</p>

                {/* Hospital */}
                <div className="space-y-2">
                  <Label>Hospital</Label>
                  <Select value={selectedHospitalId} onValueChange={handleHospitalChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={hospitalsLoading ? 'Loading...' : 'Select hospital'} />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={handleDepartmentChange}
                    disabled={!selectedHospitalId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          departmentsLoading
                            ? 'Loading...'
                            : !selectedHospitalId
                              ? 'Select hospital first'
                              : 'Select department'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ward */}
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <Select
                    value={selectedWardId}
                    onValueChange={handleWardChange}
                    disabled={!selectedDepartmentId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          wardsLoading
                            ? 'Loading...'
                            : !selectedDepartmentId
                              ? 'Select department first'
                              : 'Select ward'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.currentOccupancy}/{w.bedCapacity} beds)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Available Bed */}
                <div className="space-y-2">
                  <Label>Available Bed</Label>
                  <Select
                    value={selectedBedId}
                    onValueChange={setSelectedBedId}
                    disabled={!selectedWardId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          bedsLoading
                            ? 'Loading...'
                            : !selectedWardId
                              ? 'Select ward first'
                              : availableBeds.length === 0
                                ? 'No beds available'
                                : 'Select bed'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBeds.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          Bed {b.bedNumber} ({b.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispositionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDisposition}
              disabled={!dispositionValue || dispositionLoading}
            >
              {dispositionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Disposition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
