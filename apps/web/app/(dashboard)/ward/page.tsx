'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { hospitalsApi } from '@/lib/api/hospitals';
import { clinicalApi } from '@/lib/api/clinical';
import type { Hospital, Department, Ward, Bed } from '@/lib/types/hospital';
import type { Encounter } from '@/lib/types/clinical';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  BedDouble,
  Building2,
  Loader2,
  RefreshCw,
  User,
  Stethoscope,
  Calendar,
  Hash,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

// -- helpers ------------------------------------------------------------------

const BED_STATUS_CONFIG: Record<
  Bed['status'],
  { label: string; variant: 'success' | 'info' | 'warning' | 'secondary'; colorClass: string }
> = {
  available: { label: 'Available', variant: 'success', colorClass: 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30' },
  occupied: { label: 'Occupied', variant: 'info', colorClass: 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30' },
  reserved: { label: 'Reserved', variant: 'warning', colorClass: 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30' },
  maintenance: { label: 'Maintenance', variant: 'secondary', colorClass: 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/30' },
};

const ENCOUNTER_STATUS_LABELS: Record<string, string> = {
  admitted: 'Admitted',
  in_treatment: 'In Treatment',
  awaiting_discharge: 'Awaiting Discharge',
  discharged: 'Discharged',
  deceased: 'Deceased',
  transferred: 'Transferred',
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// -- component ----------------------------------------------------------------

export default function WardViewPage() {
  const { user } = useAuth();

  // Cascading selects state
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // Data
  const [beds, setBeds] = useState<Bed[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Auto-refresh
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- data fetching ----------------------------------------------------------

  // Fetch hospitals on mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setHospitalsLoading(true);
        const response = await hospitalsApi.findAll();
        if (response.success) {
          setHospitals(response.data);
        }
      } catch {
        // Non-critical initial load
      } finally {
        setHospitalsLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  // Fetch departments when hospital changes
  useEffect(() => {
    if (!selectedHospital) {
      setDepartments([]);
      setSelectedDepartment('');
      setWards([]);
      setSelectedWard('');
      setBeds([]);
      setEncounters([]);
      return;
    }
    const fetchDepartments = async () => {
      try {
        const response = await hospitalsApi.getDepartments(selectedHospital);
        if (response.success) {
          setDepartments(response.data);
        }
      } catch {
        setDepartments([]);
      }
    };
    fetchDepartments();
    setSelectedDepartment('');
    setWards([]);
    setSelectedWard('');
    setBeds([]);
    setEncounters([]);
  }, [selectedHospital]);

  // Fetch wards when department changes
  useEffect(() => {
    if (!selectedHospital || !selectedDepartment) {
      setWards([]);
      setSelectedWard('');
      setBeds([]);
      setEncounters([]);
      return;
    }
    const fetchWards = async () => {
      try {
        const response = await hospitalsApi.getWards(selectedHospital, selectedDepartment);
        if (response.success) {
          setWards(response.data);
        }
      } catch {
        setWards([]);
      }
    };
    fetchWards();
    setSelectedWard('');
    setBeds([]);
    setEncounters([]);
  }, [selectedHospital, selectedDepartment]);

  // Fetch beds and encounters when ward changes
  const fetchWardData = useCallback(async () => {
    if (!selectedWard) {
      setBeds([]);
      setEncounters([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const [bedsResponse, encountersResponse] = await Promise.all([
        hospitalsApi.getBeds(selectedWard),
        clinicalApi.getEncountersByWard(selectedWard),
      ]);

      if (bedsResponse.success) {
        setBeds(bedsResponse.data);
      }
      if (encountersResponse.success) {
        setEncounters(encountersResponse.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load ward data');
    } finally {
      setLoading(false);
    }
  }, [selectedWard]);

  useEffect(() => {
    fetchWardData();
  }, [fetchWardData]);

  // Auto-refresh every 30 seconds when a ward is selected
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (selectedWard) {
      refreshIntervalRef.current = setInterval(() => {
        fetchWardData();
      }, 30000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [selectedWard, fetchWardData]);

  // -- helpers ----------------------------------------------------------------

  const getEncounterForBed = (bedId: string): Encounter | undefined => {
    return encounters.find((enc) => enc.bedId === bedId);
  };

  const handleBedClick = (bed: Bed) => {
    const encounter = getEncounterForBed(bed.id);
    if (bed.status === 'occupied' && encounter) {
      setSelectedBed(bed);
      setSelectedEncounter(encounter);
      setDialogOpen(true);
    }
  };

  // Compute summary stats
  const bedSummary = {
    total: beds.length,
    available: beds.filter((b) => b.status === 'available').length,
    occupied: beds.filter((b) => b.status === 'occupied').length,
    reserved: beds.filter((b) => b.status === 'reserved').length,
    maintenance: beds.filter((b) => b.status === 'maintenance').length,
  };

  const selectedWardData = wards.find((w) => w.id === selectedWard);

  // -- render -----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ward View</h1>
          <p className="text-muted-foreground">
            Real-time bed management and patient occupancy overview
          </p>
        </div>
        {selectedWard && (
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWardData}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        )}
      </div>

      {/* Cascading Selects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Select Ward
          </CardTitle>
          <CardDescription>
            Choose a hospital, department, and ward to view bed occupancy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Hospital Select */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Hospital</Label>
              <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={hospitalsLoading ? 'Loading...' : 'Select hospital'}
                  />
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

            {/* Department Select */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Department</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                disabled={!selectedHospital}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedHospital
                        ? 'Select hospital first'
                        : departments.length === 0
                        ? 'No departments'
                        : 'Select department'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                      {d.specialty ? ` (${d.specialty})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ward Select */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Ward</Label>
              <Select
                value={selectedWard}
                onValueChange={setSelectedWard}
                disabled={!selectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedDepartment
                        ? 'Select department first'
                        : wards.length === 0
                        ? 'No wards'
                        : 'Select ward'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No ward selected state */}
      {!selectedWard && !loading && (
        <Card>
          <CardContent className="py-20">
            <div className="flex flex-col items-center justify-center text-center">
              <BedDouble className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium text-lg text-muted-foreground">
                Select a hospital, department, and ward to view beds
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Use the selectors above to navigate to a specific ward
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && selectedWard && (
        <Card>
          <CardContent className="py-20">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading ward data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card>
          <CardContent className="py-20">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={fetchWardData}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ward summary + bed grid */}
      {selectedWard && !loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
                <BedDouble className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bedSummary.total}</div>
                {selectedWardData && (
                  <p className="text-xs text-muted-foreground">
                    Capacity: {selectedWardData.bedCapacity}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{bedSummary.available}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied</CardTitle>
                <div className="h-3 w-3 rounded-full bg-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{bedSummary.occupied}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reserved</CardTitle>
                <div className="h-3 w-3 rounded-full bg-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{bedSummary.reserved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                <div className="h-3 w-3 rounded-full bg-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">{bedSummary.maintenance}</div>
              </CardContent>
            </Card>
          </div>

          {/* Bed Grid */}
          {beds.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <BedDouble className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium text-muted-foreground">No beds in this ward</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This ward currently has no beds configured.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {beds.map((bed) => {
                const statusConfig = BED_STATUS_CONFIG[bed.status];
                const encounter = getEncounterForBed(bed.id);
                const isClickable = bed.status === 'occupied' && !!encounter;

                return (
                  <Card
                    key={bed.id}
                    className={`transition-all ${statusConfig.colorClass} ${
                      isClickable
                        ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]'
                        : ''
                    }`}
                    onClick={() => handleBedClick(bed)}
                  >
                    <CardContent className="p-4">
                      {/* Bed header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xl font-bold">{bed.bedNumber}</span>
                        </div>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </div>

                      <Separator className="mb-3" />

                      {/* Bed content */}
                      {bed.status === 'occupied' && encounter ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">
                              {encounter.patientName || 'Unknown Patient'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-mono text-xs">
                              {encounter.patientChi || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              Admitted: {formatDate(encounter.admissionDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                              {encounter.doctorName
                                ? `Dr ${encounter.doctorName}`
                                : 'No attending doctor'}
                            </span>
                          </div>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {ENCOUNTER_STATUS_LABELS[encounter.status] || encounter.status}
                            </Badge>
                          </div>
                        </div>
                      ) : bed.status === 'available' ? (
                        <div className="py-3 text-center">
                          <p className="text-sm text-emerald-600 font-medium">Available</p>
                        </div>
                      ) : bed.status === 'reserved' ? (
                        <div className="py-3 text-center">
                          <p className="text-sm text-amber-600 font-medium">Reserved</p>
                          {bed.notes && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {bed.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="py-3 text-center">
                          <p className="text-sm text-gray-500 font-medium">Under Maintenance</p>
                          {bed.notes && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {bed.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Patient Summary Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Patient Summary</DialogTitle>
            <DialogDescription>
              Bed {selectedBed?.bedNumber} - Patient details and encounter information
            </DialogDescription>
          </DialogHeader>
          {selectedEncounter && selectedBed && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Patient Name</p>
                  <p className="font-medium">
                    {selectedEncounter.patientName || 'Unknown Patient'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">CHI Number</p>
                  <p className="font-medium font-mono">
                    {selectedEncounter.patientChi || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bed Number</p>
                  <p className="font-medium">{selectedBed.bedNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bed Type</p>
                  <p className="font-medium capitalize">{selectedBed.type || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Admission Date</p>
                  <p className="font-medium">{formatDate(selectedEncounter.admissionDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Encounter Status</p>
                  <Badge variant="info">
                    {ENCOUNTER_STATUS_LABELS[selectedEncounter.status] || selectedEncounter.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Encounter Type</p>
                  <p className="font-medium capitalize">{selectedEncounter.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Attending Doctor</p>
                  <p className="font-medium">
                    {selectedEncounter.doctorName
                      ? `Dr ${selectedEncounter.doctorName}`
                      : '-'}
                  </p>
                </div>
              </div>

              {selectedEncounter.chiefComplaint && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Chief Complaint</p>
                  <p className="mt-1">{selectedEncounter.chiefComplaint}</p>
                </div>
              )}

              {selectedEncounter.diagnosis && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Diagnosis</p>
                  <p className="mt-1">{selectedEncounter.diagnosis}</p>
                </div>
              )}

              {selectedEncounter.treatmentPlan && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Treatment Plan</p>
                  <p className="mt-1">{selectedEncounter.treatmentPlan}</p>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Encounter created: {formatDate(selectedEncounter.createdAt)}
                </p>
                <Link href={`/patients/${selectedEncounter.patientId}`}>
                  <Button variant="default" size="sm" className="gap-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Patient
                  </Button>
                </Link>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
