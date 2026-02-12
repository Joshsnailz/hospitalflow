'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appointmentsApi } from '@/lib/api/appointments';
import { hospitalsApi } from '@/lib/api/hospitals';
import type { Appointment } from '@/lib/types/appointment';
import type { Hospital, Department, Ward, Bed } from '@/lib/types/hospital';
import { Loader2 } from 'lucide-react';

interface CompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CompleteDialog({
  open,
  onOpenChange,
  appointment,
  onSuccess,
  onError,
}: CompleteDialogProps) {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<'discharge' | 'admit'>('discharge');
  const [encounterType, setEncounterType] = useState('inpatient');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [admissionDiagnosis, setAdmissionDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);

  // Cascading selects
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
    if (open) {
      setNotes('');
      setDecision('discharge');
      setEncounterType('inpatient');
      setChiefComplaint('');
      setAdmissionDiagnosis('');
      setSelectedHospitalId('');
      setSelectedDepartmentId('');
      setSelectedWardId('');
      setSelectedBedId('');
      setDepartments([]);
      setWards([]);
      setAvailableBeds([]);
      fetchHospitals();
    }
  }, [open]);

  const fetchHospitals = async () => {
    try {
      setHospitalsLoading(true);
      const response = await hospitalsApi.findAll();
      if (response.success) setHospitals(response.data);
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
      if (response.success) setDepartments(response.data);
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
      if (response.success) setWards(response.data);
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
      if (response.success) setAvailableBeds(response.data);
    } catch {
      // Non-critical
    } finally {
      setBedsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!appointment) return;
    try {
      setLoading(true);
      const payload: Record<string, any> = {
        notes: notes || undefined,
        createEncounter: decision === 'admit',
      };
      if (decision === 'admit') {
        payload.encounterType = encounterType;
        payload.hospitalId = selectedHospitalId || undefined;
        payload.departmentId = selectedDepartmentId || undefined;
        payload.wardId = selectedWardId || undefined;
        payload.bedId = selectedBedId || undefined;
        payload.chiefComplaint = chiefComplaint || undefined;
        payload.admissionDiagnosis = admissionDiagnosis || undefined;
      }
      await appointmentsApi.completeAppointment(appointment.id, payload);
      onSuccess('Appointment completed successfully');
      onOpenChange(false);
    } catch (err: any) {
      onError(err?.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Complete Appointment</DialogTitle>
          <DialogDescription>
            Complete {appointment?.patientName || 'this patient'}&apos;s appointment and choose a discharge or admission pathway.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="complete-notes">Notes</Label>
            <Textarea
              id="complete-notes"
              placeholder="Appointment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Decision</Label>
            <Select value={decision} onValueChange={(v) => setDecision(v as 'discharge' | 'admit')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discharge">Outpatient Discharge</SelectItem>
                <SelectItem value="admit">Admit (Inpatient)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {decision === 'admit' && (
            <>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Admission Details</p>

              <div className="space-y-2">
                <Label>Encounter Type</Label>
                <Select value={encounterType} onValueChange={setEncounterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inpatient">Inpatient</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="day_case">Day Case</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-chief-complaint">Chief Complaint</Label>
                <Textarea
                  id="complete-chief-complaint"
                  placeholder="Describe the chief complaint..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-admission-diagnosis">Admission Diagnosis</Label>
                <Textarea
                  id="complete-admission-diagnosis"
                  placeholder="Admission diagnosis..."
                  value={admissionDiagnosis}
                  onChange={(e) => setAdmissionDiagnosis(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Bed Assignment</p>

              <div className="space-y-2">
                <Label>Hospital</Label>
                <Select value={selectedHospitalId} onValueChange={handleHospitalChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={hospitalsLoading ? 'Loading...' : 'Select hospital'} />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={selectedDepartmentId} onValueChange={handleDepartmentChange} disabled={!selectedHospitalId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        departmentsLoading ? 'Loading...' : !selectedHospitalId ? 'Select hospital first' : 'Select department'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ward</Label>
                <Select value={selectedWardId} onValueChange={handleWardChange} disabled={!selectedDepartmentId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        wardsLoading ? 'Loading...' : !selectedDepartmentId ? 'Select department first' : 'Select ward'
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

              <div className="space-y-2">
                <Label>Available Bed</Label>
                <Select value={selectedBedId} onValueChange={setSelectedBedId} disabled={!selectedWardId}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
