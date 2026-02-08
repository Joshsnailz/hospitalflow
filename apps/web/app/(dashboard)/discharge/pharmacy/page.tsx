'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clinicalApi } from '@/lib/api/clinical';
import type { DischargeForm, MedicationEntry } from '@/lib/types/clinical';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Loader2,
  RefreshCw,
  Pill,
  CheckCircle,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';

const EMPTY_MEDICATION: MedicationEntry = {
  name: '',
  dosage: '',
  frequency: '',
  route: '',
  duration: '',
  instructions: '',
};

function getReviewStatusBadge(form: DischargeForm) {
  if (form.pharmacyReviewedBy) {
    return <Badge variant="success">Reviewed</Badge>;
  }
  return <Badge variant="warning">Pending</Badge>;
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

export default function PharmacyDischargePage() {
  const router = useRouter();
  const [forms, setForms] = useState<DischargeForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<DischargeForm | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medications, setMedications] = useState<MedicationEntry[]>([]);
  const [pharmacyNotes, setPharmacyNotes] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');

  // Mark reviewed
  const [isMarking, setIsMarking] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await clinicalApi.getDischargeForms({ status: 'active' });
      setForms(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load discharge forms');
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewDialog = (form: DischargeForm) => {
    setSelectedForm(form);
    setMedications(
      form.medicationsOnDischarge && form.medicationsOnDischarge.length > 0
        ? [...form.medicationsOnDischarge]
        : [{ ...EMPTY_MEDICATION }]
    );
    setPharmacyNotes(form.pharmacyNotes || '');
    setReviewedBy(form.pharmacyReviewedBy || '');
    setReviewDialogOpen(true);
  };

  const handleAddMedication = () => {
    setMedications((prev) => [...prev, { ...EMPTY_MEDICATION }]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (
    index: number,
    field: keyof MedicationEntry,
    value: string
  ) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const handleSubmitReview = async () => {
    if (!selectedForm) return;
    setIsSubmitting(true);
    setError('');
    try {
      await clinicalApi.updateDischargeSection(selectedForm.id, {
        section: 'pharmacy',
        content: {
          medicationsOnDischarge: medications.filter((m) => m.name.trim() !== ''),
          pharmacyNotes,
          pharmacyReviewedBy: reviewedBy,
        },
        version: selectedForm.version,
      });
      setReviewDialogOpen(false);
      setSelectedForm(null);
      fetchForms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit pharmacy review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkReviewed = async (form: DischargeForm) => {
    setIsMarking(form.id);
    setError('');
    try {
      await clinicalApi.updateDischargeSection(form.id, {
        section: 'pharmacy',
        content: {
          medicationsOnDischarge: form.medicationsOnDischarge || [],
          pharmacyNotes: form.pharmacyNotes || '',
          pharmacyReviewedBy: 'Pharmacy Team',
        },
        version: form.version,
      });
      fetchForms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark as reviewed');
    } finally {
      setIsMarking(null);
    }
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
            <Pill className="h-8 w-8" />
            Pharmacy Discharge List
          </h1>
          <p className="text-muted-foreground">
            Review discharge medications and complete pharmacy sign-off for patients
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchForms}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
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

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Pill className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Forms</p>
                <p className="text-xl font-bold">{forms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Reviewed</p>
                <p className="text-xl font-bold">
                  {forms.filter((f) => f.pharmacyReviewedBy).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-xl font-bold">
                  {forms.filter((f) => !f.pharmacyReviewedBy).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active discharge forms to review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>CHI</TableHead>
                  <TableHead>Medications on Discharge</TableHead>
                  <TableHead>Pharmacy Reviewed By</TableHead>
                  <TableHead>Pharmacy Notes</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>
                      {form.medicationsOnDischarge && form.medicationsOnDischarge.length > 0 ? (
                        <span className="text-sm">
                          {form.medicationsOnDischarge.length} medication
                          {form.medicationsOnDischarge.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>{form.pharmacyReviewedBy || '--'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {form.pharmacyNotes || '--'}
                    </TableCell>
                    <TableCell>{getReviewStatusBadge(form)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(form)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Review
                        </Button>
                        {!form.pharmacyReviewedBy && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkReviewed(form)}
                            disabled={isMarking === form.id}
                          >
                            {isMarking === form.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            Mark Reviewed
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pharmacy Review</DialogTitle>
            <DialogDescription>
              Review and update discharge medications for{' '}
              <span className="font-semibold">{selectedForm?.patientName}</span>
              {(selectedForm?.patientChi || selectedForm?.patientChiNumber) && (
                <> (CHI: <span className="font-mono">{selectedForm.patientChi || selectedForm.patientChiNumber}</span>)</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Medications List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Medications on Discharge</Label>
                <Button variant="outline" size="sm" onClick={handleAddMedication}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Medication
                </Button>
              </div>

              {medications.map((med, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Medication {index + 1}
                      </span>
                      {medications.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedication(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          placeholder="Medication name"
                          value={med.name}
                          onChange={(e) =>
                            handleMedicationChange(index, 'name', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dosage</Label>
                        <Input
                          placeholder="e.g., 500mg"
                          value={med.dosage}
                          onChange={(e) =>
                            handleMedicationChange(index, 'dosage', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Frequency</Label>
                        <Input
                          placeholder="e.g., Twice daily"
                          value={med.frequency}
                          onChange={(e) =>
                            handleMedicationChange(index, 'frequency', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Route</Label>
                        <Input
                          placeholder="e.g., Oral"
                          value={med.route}
                          onChange={(e) =>
                            handleMedicationChange(index, 'route', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Duration</Label>
                        <Input
                          placeholder="e.g., 7 days"
                          value={med.duration}
                          onChange={(e) =>
                            handleMedicationChange(index, 'duration', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Instructions</Label>
                        <Input
                          placeholder="e.g., Take with food"
                          value={med.instructions}
                          onChange={(e) =>
                            handleMedicationChange(index, 'instructions', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pharmacy Notes */}
            <div className="space-y-2">
              <Label htmlFor="pharmacy-notes">Pharmacy Notes</Label>
              <Textarea
                id="pharmacy-notes"
                placeholder="Enter pharmacy review notes..."
                value={pharmacyNotes}
                onChange={(e) => setPharmacyNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Reviewed By */}
            <div className="space-y-2">
              <Label htmlFor="reviewed-by">Reviewed By</Label>
              <Input
                id="reviewed-by"
                placeholder="Pharmacist name"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={isSubmitting || !reviewedBy}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
