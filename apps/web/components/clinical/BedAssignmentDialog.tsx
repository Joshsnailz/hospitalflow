'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { hospitalsApi } from '@/lib/api/hospitals';
import type { Hospital, Department, Ward, Bed } from '@/lib/types/hospital';

interface BedAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (data: {
    hospitalId: string;
    departmentId: string;
    wardId: string;
    bedId: string;
  }) => void;
  title?: string;
  description?: string;
}

export function BedAssignmentDialog({
  open,
  onOpenChange,
  onAssign,
  title = 'Assign Bed',
  description = 'Select a hospital, department, ward, and available bed to assign the patient.',
}: BedAssignmentDialogProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [selectedBedId, setSelectedBedId] = useState<string>('');

  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const [assigning, setAssigning] = useState(false);

  // Fetch hospitals on mount / when dialog opens
  const fetchHospitals = useCallback(async () => {
    setLoadingHospitals(true);
    try {
      const response = await hospitalsApi.findAll();
      setHospitals(response.data || []);
    } catch {
      setHospitals([]);
    } finally {
      setLoadingHospitals(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchHospitals();
    }
  }, [open, fetchHospitals]);

  // Reset all selections when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedHospitalId('');
      setSelectedDepartmentId('');
      setSelectedWardId('');
      setSelectedBedId('');
      setDepartments([]);
      setWards([]);
      setBeds([]);
    }
  }, [open]);

  // Fetch departments when hospital changes
  useEffect(() => {
    if (!selectedHospitalId) {
      setDepartments([]);
      return;
    }

    let cancelled = false;
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      // Reset downstream
      setSelectedDepartmentId('');
      setSelectedWardId('');
      setSelectedBedId('');
      setWards([]);
      setBeds([]);

      try {
        const response = await hospitalsApi.getDepartments(selectedHospitalId);
        if (!cancelled) {
          setDepartments(response.data || []);
        }
      } catch {
        if (!cancelled) {
          setDepartments([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingDepartments(false);
        }
      }
    };

    fetchDepartments();
    return () => {
      cancelled = true;
    };
  }, [selectedHospitalId]);

  // Fetch wards when department changes
  useEffect(() => {
    if (!selectedHospitalId || !selectedDepartmentId) {
      setWards([]);
      return;
    }

    let cancelled = false;
    const fetchWards = async () => {
      setLoadingWards(true);
      // Reset downstream
      setSelectedWardId('');
      setSelectedBedId('');
      setBeds([]);

      try {
        const response = await hospitalsApi.getWards(
          selectedHospitalId,
          selectedDepartmentId
        );
        if (!cancelled) {
          setWards(response.data || []);
        }
      } catch {
        if (!cancelled) {
          setWards([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingWards(false);
        }
      }
    };

    fetchWards();
    return () => {
      cancelled = true;
    };
  }, [selectedHospitalId, selectedDepartmentId]);

  // Fetch available beds when ward changes
  useEffect(() => {
    if (!selectedWardId) {
      setBeds([]);
      return;
    }

    let cancelled = false;
    const fetchBeds = async () => {
      setLoadingBeds(true);
      setSelectedBedId('');

      try {
        const response = await hospitalsApi.getAvailableBeds({
          wardId: selectedWardId,
        });
        if (!cancelled) {
          setBeds(response.data || []);
        }
      } catch {
        if (!cancelled) {
          setBeds([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingBeds(false);
        }
      }
    };

    fetchBeds();
    return () => {
      cancelled = true;
    };
  }, [selectedWardId]);

  const canAssign =
    selectedHospitalId &&
    selectedDepartmentId &&
    selectedWardId &&
    selectedBedId &&
    !assigning;

  const handleAssign = async () => {
    if (!canAssign) return;

    setAssigning(true);
    try {
      onAssign({
        hospitalId: selectedHospitalId,
        departmentId: selectedDepartmentId,
        wardId: selectedWardId,
        bedId: selectedBedId,
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Hospital Select */}
          <div className="space-y-2">
            <Label htmlFor="hospital-select">Hospital</Label>
            <Select
              value={selectedHospitalId}
              onValueChange={setSelectedHospitalId}
              disabled={loadingHospitals}
            >
              <SelectTrigger id="hospital-select">
                {loadingHospitals ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading hospitals...
                  </span>
                ) : (
                  <SelectValue placeholder="Select a hospital" />
                )}
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
                {!loadingHospitals && hospitals.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hospitals found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Department Select */}
          <div className="space-y-2">
            <Label htmlFor="department-select">Department</Label>
            <Select
              value={selectedDepartmentId}
              onValueChange={setSelectedDepartmentId}
              disabled={!selectedHospitalId || loadingDepartments}
            >
              <SelectTrigger id="department-select">
                {loadingDepartments ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading departments...
                  </span>
                ) : (
                  <SelectValue
                    placeholder={
                      selectedHospitalId
                        ? 'Select a department'
                        : 'Select a hospital first'
                    }
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
                {!loadingDepartments &&
                  selectedHospitalId &&
                  departments.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No departments found
                    </div>
                  )}
              </SelectContent>
            </Select>
          </div>

          {/* Ward Select */}
          <div className="space-y-2">
            <Label htmlFor="ward-select">Ward</Label>
            <Select
              value={selectedWardId}
              onValueChange={setSelectedWardId}
              disabled={!selectedDepartmentId || loadingWards}
            >
              <SelectTrigger id="ward-select">
                {loadingWards ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading wards...
                  </span>
                ) : (
                  <SelectValue
                    placeholder={
                      selectedDepartmentId
                        ? 'Select a ward'
                        : 'Select a department first'
                    }
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                {wards.map((ward) => (
                  <SelectItem key={ward.id} value={ward.id}>
                    {ward.name} ({ward.currentOccupancy}/{ward.bedCapacity}{' '}
                    occupied)
                  </SelectItem>
                ))}
                {!loadingWards &&
                  selectedDepartmentId &&
                  wards.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No wards found
                    </div>
                  )}
              </SelectContent>
            </Select>
          </div>

          {/* Bed Select */}
          <div className="space-y-2">
            <Label htmlFor="bed-select">Available Bed</Label>
            <Select
              value={selectedBedId}
              onValueChange={setSelectedBedId}
              disabled={!selectedWardId || loadingBeds}
            >
              <SelectTrigger id="bed-select">
                {loadingBeds ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available beds...
                  </span>
                ) : (
                  <SelectValue
                    placeholder={
                      selectedWardId
                        ? 'Select an available bed'
                        : 'Select a ward first'
                    }
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                {beds.map((bed) => (
                  <SelectItem key={bed.id} value={bed.id}>
                    Bed {bed.bedNumber} — {bed.type}
                  </SelectItem>
                ))}
                {!loadingBeds && selectedWardId && beds.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No available beds in this ward
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!canAssign}>
            {assigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Bed'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
