'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble,
  Loader2,
  AlertTriangle,
  Clock,
  MapPin,
  Siren,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clinicalApi } from '@/lib/api/clinical';
import { hospitalsApi } from '@/lib/api/hospitals';
import type { Encounter, EncounterStatus } from '@/lib/types/clinical';
import type { EmergencyStatus } from '@/lib/types/clinical';

interface PatientLocationBannerProps {
  patientId: string;
}

type BannerStatus =
  | 'admitted'
  | 'awaiting_discharge'
  | 'emergency'
  | 'inactive';

interface BannerState {
  status: BannerStatus;
  text: string;
  subtext?: string;
}

// Active encounter statuses
const ACTIVE_ENCOUNTER_STATUSES: EncounterStatus[] = ['admitted', 'in_treatment'];
const AWAITING_DISCHARGE_STATUS: EncounterStatus = 'awaiting_discharge';

// Active emergency statuses from the type definition that represent still-in-ED
const ACTIVE_EMERGENCY_STATUSES: EmergencyStatus[] = [
  'triaged',
  'in_treatment',
  'observation',
];

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getBannerStyles(status: BannerStatus): {
  container: string;
  icon: string;
} {
  switch (status) {
    case 'admitted':
      return {
        container: 'bg-blue-50 border-blue-200 text-blue-900',
        icon: 'text-blue-600',
      };
    case 'awaiting_discharge':
      return {
        container: 'bg-amber-50 border-amber-200 text-amber-900',
        icon: 'text-amber-600',
      };
    case 'emergency':
      return {
        container: 'bg-red-50 border-red-200 text-red-900',
        icon: 'text-red-600',
      };
    case 'inactive':
    default:
      return {
        container: 'bg-slate-50 border-slate-200 text-slate-600',
        icon: 'text-slate-400',
      };
  }
}

function getBannerIcon(status: BannerStatus) {
  switch (status) {
    case 'admitted':
      return BedDouble;
    case 'awaiting_discharge':
      return Clock;
    case 'emergency':
      return Siren;
    case 'inactive':
    default:
      return MapPin;
  }
}

export function PatientLocationBanner({
  patientId,
}: PatientLocationBannerProps) {
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveWardAndBedNames = useCallback(
    async (
      encounter: Encounter
    ): Promise<{ wardName: string; bedNumber: string }> => {
      let wardName = 'Unknown Ward';
      let bedNumber = 'Unknown Bed';

      if (encounter.wardId) {
        try {
          // Fetch the beds for the ward to get both ward info (from encounter)
          // and the specific bed details
          const bedsResponse = await hospitalsApi.getBeds(encounter.wardId);
          const beds = bedsResponse.data || [];

          if (encounter.bedId) {
            const matchingBed = beds.find(
              (bed) => bed.id === encounter.bedId
            );
            if (matchingBed) {
              bedNumber = matchingBed.bedNumber;
            }
          }
        } catch {
          // Keep defaults on failure
        }

        // Try to get ward name from the wards endpoint if hospital/dept known
        if (encounter.hospitalId && encounter.departmentId) {
          try {
            const wardsResponse = await hospitalsApi.getWards(
              encounter.hospitalId,
              encounter.departmentId
            );
            const wards = wardsResponse.data || [];
            const matchingWard = wards.find(
              (ward) => ward.id === encounter.wardId
            );
            if (matchingWard) {
              wardName = matchingWard.name;
            }
          } catch {
            // Keep defaults on failure
          }
        }
      }

      return { wardName, bedNumber };
    },
    []
  );

  const fetchLocationData = useCallback(async () => {
    setLoading(true);

    try {
      const [encountersRes, emergencyRes] = await Promise.allSettled([
        clinicalApi.getEncountersByPatient(patientId),
        clinicalApi.getEmergencyVisitsByPatient(patientId),
      ]);

      // Check for active encounters first (admitted / in_treatment)
      if (encountersRes.status === 'fulfilled') {
        const encounters: Encounter[] = encountersRes.value.data || [];

        // Check for actively admitted encounter
        const activeEncounter = encounters.find((enc) =>
          ACTIVE_ENCOUNTER_STATUSES.includes(enc.status)
        );

        if (activeEncounter) {
          const { wardName, bedNumber } =
            await resolveWardAndBedNames(activeEncounter);
          setBannerState({
            status: 'admitted',
            text: `Currently admitted in ${wardName}, Bed ${bedNumber}`,
            subtext: formatStatusLabel(activeEncounter.status),
          });
          setLoading(false);
          return;
        }

        // Check for awaiting discharge
        const awaitingDischarge = encounters.find(
          (enc) => enc.status === AWAITING_DISCHARGE_STATUS
        );

        if (awaitingDischarge) {
          const { wardName, bedNumber } =
            await resolveWardAndBedNames(awaitingDischarge);
          setBannerState({
            status: 'awaiting_discharge',
            text: `Awaiting Discharge \u2014 ${wardName}, Bed ${bedNumber}`,
          });
          setLoading(false);
          return;
        }
      }

      // Check for active emergency visit
      if (emergencyRes.status === 'fulfilled') {
        const visits = emergencyRes.value.data || [];

        const activeVisit = visits.find((visit: { status: EmergencyStatus }) =>
          ACTIVE_EMERGENCY_STATUSES.includes(visit.status)
        );

        if (activeVisit) {
          setBannerState({
            status: 'emergency',
            text: `Emergency Department \u2014 ${formatStatusLabel(activeVisit.status)}`,
            subtext: activeVisit.chiefComplaint || undefined,
          });
          setLoading(false);
          return;
        }
      }

      // No active records
      setBannerState({
        status: 'inactive',
        text: 'No active admission',
      });
    } catch {
      setBannerState({
        status: 'inactive',
        text: 'Unable to determine current location',
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, resolveWardAndBedNames]);

  useEffect(() => {
    if (patientId) {
      fetchLocationData();
    }
  }, [patientId, fetchLocationData]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading patient location...
        </span>
      </div>
    );
  }

  if (!bannerState) {
    return null;
  }

  const styles = getBannerStyles(bannerState.status);
  const Icon = getBannerIcon(bannerState.status);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3',
        styles.container
      )}
      role="status"
      aria-label={`Patient location: ${bannerState.text}`}
    >
      <Icon className={cn('h-5 w-5 shrink-0', styles.icon)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          {bannerState.text}
        </p>
        {bannerState.subtext && (
          <p className="text-xs opacity-80 mt-0.5">{bannerState.subtext}</p>
        )}
      </div>

      {bannerState.status === 'emergency' && (
        <AlertTriangle className={cn('h-4 w-4 shrink-0', styles.icon)} />
      )}
    </div>
  );
}
