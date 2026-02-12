'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { clinicalApi } from '@/lib/api/clinical';
import type { DischargeForm, DischargeStatus, MedicationEntry, ProcedureEntry } from '@/lib/types/clinical';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowLeft,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  Pill,
  Scissors,
  Heart,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';
import { SnomedSearchInput } from '@/components/shared/snomed-search-input';
import { Combobox } from '@/components/ui/combobox';
import { MEDICATION_FREQUENCIES } from '@/lib/data/medication-frequencies';
import { MEDICATION_ROUTES } from '@/lib/data/medication-routes';

const EMPTY_MEDICATION: MedicationEntry = {
  name: '',
  dosage: '',
  frequency: '',
  route: '',
  duration: '',
  instructions: '',
};

const EMPTY_PROCEDURE: ProcedureEntry = {
  name: '',
  date: '',
  surgeon: '',
  notes: '',
  outcome: '',
};

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

interface DischargeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DischargeDetailPage({ params }: DischargeDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [form, setForm] = useState<DischargeForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Section saving states
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  // Complete discharge dialog
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Clinical Summary fields
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState('');
  const [treatmentProvided, setTreatmentProvided] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');

  // Medications fields
  const [medications, setMedications] = useState<MedicationEntry[]>([]);
  const [pharmacyNotes, setPharmacyNotes] = useState('');

  // Operations & Procedures fields
  const [procedures, setProcedures] = useState<ProcedureEntry[]>([]);
  const [surgeonNotes, setSurgeonNotes] = useState('');

  // Nursing fields
  const [nursingNotes, setNursingNotes] = useState('');
  const [vitalsBP, setVitalsBP] = useState('');
  const [vitalsHR, setVitalsHR] = useState('');
  const [vitalsTemp, setVitalsTemp] = useState('');
  const [vitalsSpO2, setVitalsSpO2] = useState('');
  const [vitalsRR, setVitalsRR] = useState('');
  const [dietaryInstructions, setDietaryInstructions] = useState('');
  const [activityRestrictions, setActivityRestrictions] = useState('');

  // Follow-up fields
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpDoctor, setFollowUpDoctor] = useState('');
  const [patientEducation, setPatientEducation] = useState('');

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await clinicalApi.getDischargeForm(id);
      const data = response.data;
      setForm(data);
      populateFields(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load discharge form');
    } finally {
      setIsLoading(false);
    }
  };

  const populateFields = (data: DischargeForm) => {
    // Clinical Summary
    setPrimaryDiagnosis(data.primaryDiagnosis || '');
    setSecondaryDiagnoses(data.secondaryDiagnoses ? data.secondaryDiagnoses.join('\n') : '');
    setTreatmentProvided(data.treatmentProvided || '');
    setClinicalSummary(data.clinicalSummary || '');

    // Medications
    setMedications(
      data.medicationsOnDischarge && data.medicationsOnDischarge.length > 0
        ? [...data.medicationsOnDischarge]
        : [{ ...EMPTY_MEDICATION }]
    );
    setPharmacyNotes(data.pharmacyNotes || '');

    // Procedures
    setProcedures(
      data.operationsAndProcedures && data.operationsAndProcedures.length > 0
        ? [...data.operationsAndProcedures]
        : [{ ...EMPTY_PROCEDURE }]
    );
    setSurgeonNotes(data.surgeonNotes || '');

    // Nursing
    setNursingNotes(data.nursingNotes || '');
    const vitals = data.vitalSignsOnDischarge || {};
    setVitalsBP(vitals.bp || '');
    setVitalsHR(vitals.hr || '');
    setVitalsTemp(vitals.temp || '');
    setVitalsSpO2(vitals.spo2 || '');
    setVitalsRR(vitals.rr || '');
    setDietaryInstructions(data.dietaryInstructions || '');
    setActivityRestrictions(data.activityRestrictions || '');

    // Follow-up
    setFollowUpInstructions(data.followUpInstructions || '');
    setFollowUpDate(data.followUpDate ? data.followUpDate.split('T')[0] : '');
    setFollowUpDoctor(data.followUpDoctor || '');
    setPatientEducation(data.patientEducation || '');
  };

  const saveSection = async (section: string, content: Record<string, any>) => {
    if (!form) return;
    setSavingSection(section);
    setSaveMessage('');
    try {
      const response = await clinicalApi.updateDischargeSection(form.id, {
        section,
        content,
        version: form.version,
      });
      setForm(response.data);
      populateFields(response.data);
      setSaveMessage(`${section} section saved successfully`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setSaveMessage(err.response?.data?.message || `Failed to save ${section} section`);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveClinicalSummary = () => {
    saveSection('clinical', {
      primaryDiagnosis,
      secondaryDiagnoses: secondaryDiagnoses
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s),
      treatmentProvided,
      clinicalSummary,
    });
  };

  const handleSaveMedications = () => {
    saveSection('pharmacy', {
      medicationsOnDischarge: medications.filter((m) => m.name.trim() !== ''),
      pharmacyNotes,
    });
  };

  const handleSaveProcedures = () => {
    saveSection('operations', {
      operationsAndProcedures: procedures.filter((p) => p.name.trim() !== ''),
      surgeonNotes,
    });
  };

  const handleSaveNursing = () => {
    saveSection('nursing', {
      nursingNotes,
      vitalSignsOnDischarge: {
        bp: vitalsBP,
        hr: vitalsHR,
        temp: vitalsTemp,
        spo2: vitalsSpO2,
        rr: vitalsRR,
      },
      dietaryInstructions,
      activityRestrictions,
    });
  };

  const handleSaveFollowUp = () => {
    saveSection('followup', {
      followUpInstructions,
      followUpDate: followUpDate || null,
      followUpDoctor,
      patientEducation,
    });
  };

  const handleCompleteDischarge = async () => {
    if (!form) return;
    setIsCompleting(true);
    try {
      await clinicalApi.completeDischarge(form.id);
      setCompleteDialogOpen(false);
      fetchForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete discharge');
    } finally {
      setIsCompleting(false);
    }
  };

  // Medication helpers
  const handleAddMedication = () => {
    setMedications((prev) => [...prev, { ...EMPTY_MEDICATION }]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: keyof MedicationEntry, value: string) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  // Procedure helpers
  const handleAddProcedure = () => {
    setProcedures((prev) => [...prev, { ...EMPTY_PROCEDURE }]);
  };

  const handleRemoveProcedure = (index: number) => {
    setProcedures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcedureChange = (index: number, field: keyof ProcedureEntry, value: string) => {
    setProcedures((prev) =>
      prev.map((proc, i) => (i === index ? { ...proc, [field]: value } : proc))
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="py-12 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => router.push('/discharge/clinical')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              <Button onClick={fetchForm}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/discharge/clinical')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Discharge Form</h1>
            <p className="text-muted-foreground text-sm">
              Version {form.version} | Last updated {formatDateTime(form.updatedAt)}
              {form.lastUpdatedBy && <> by {form.lastUpdatedBy}</>}
              {form.lastUpdatedSection && <> ({form.lastUpdatedSection} section)</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(form.status)}
          {form.status === 'active' && (
            <Button onClick={() => setCompleteDialogOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Discharge
            </Button>
          )}
        </div>
      </div>

      {/* Patient Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient Name</p>
              <p className="font-semibold">{form.patientName || '--'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CHI Number</p>
              <p className="font-mono font-semibold">{form.patientChiNumber || '--'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admission Date</p>
              <p className="font-semibold">{formatDate(form.admissionDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(form.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Message */}
      {saveMessage && (
        <Card className={saveMessage.includes('success') ? 'border-green-300' : 'border-destructive'}>
          <CardContent className="pt-4 pb-4">
            <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-700' : 'text-destructive'}`}>
              {saveMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Interface */}
      <Tabs defaultValue="clinical" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="clinical" className="gap-2">
            <FileText className="h-4 w-4 hidden sm:inline" />
            Clinical Summary
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-2">
            <Pill className="h-4 w-4 hidden sm:inline" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Scissors className="h-4 w-4 hidden sm:inline" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="nursing" className="gap-2">
            <Heart className="h-4 w-4 hidden sm:inline" />
            Nursing
          </TabsTrigger>
          <TabsTrigger value="followup" className="gap-2">
            <CalendarCheck className="h-4 w-4 hidden sm:inline" />
            Follow-up
          </TabsTrigger>
        </TabsList>

        {/* Clinical Summary Tab */}
        <TabsContent value="clinical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Clinical Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-diagnosis">Primary Diagnosis</Label>
                <Textarea
                  id="primary-diagnosis"
                  placeholder="Enter primary diagnosis..."
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-diagnoses">Secondary Diagnoses (one per line)</Label>
                <Textarea
                  id="secondary-diagnoses"
                  placeholder="Enter secondary diagnoses, one per line..."
                  value={secondaryDiagnoses}
                  onChange={(e) => setSecondaryDiagnoses(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment-provided">Treatment Provided</Label>
                <Textarea
                  id="treatment-provided"
                  placeholder="Describe treatment provided during admission..."
                  value={treatmentProvided}
                  onChange={(e) => setTreatmentProvided(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinical-summary">Clinical Summary</Label>
                <Textarea
                  id="clinical-summary"
                  placeholder="Enter overall clinical summary..."
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveClinicalSummary}
                  disabled={savingSection === 'clinical'}
                >
                  {savingSection === 'clinical' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medications on Discharge
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddMedication}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Medication
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {medications.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Instructions</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medications.map((med, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <SnomedSearchInput
                            value={med.name}
                            onValueChange={(value) => handleMedicationChange(index, 'name', value)}
                            searchType="drugs"
                            allowFreeText
                            placeholder="Search medications..."
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Dosage"
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Combobox
                            value={med.frequency}
                            onValueChange={(value) => handleMedicationChange(index, 'frequency', value)}
                            options={MEDICATION_FREQUENCIES}
                            allowFreeText
                            placeholder="Frequency"
                          />
                        </TableCell>
                        <TableCell>
                          <Combobox
                            value={med.route}
                            onValueChange={(value) => handleMedicationChange(index, 'route', value)}
                            options={MEDICATION_ROUTES}
                            placeholder="Route"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Duration"
                            value={med.duration}
                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Instructions"
                            value={med.instructions}
                            onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMedication(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="space-y-2">
                <Label htmlFor="pharmacy-notes">Pharmacy Notes</Label>
                <Textarea
                  id="pharmacy-notes"
                  placeholder="Enter pharmacy notes..."
                  value={pharmacyNotes}
                  onChange={(e) => setPharmacyNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveMedications}
                  disabled={savingSection === 'pharmacy'}
                >
                  {savingSection === 'pharmacy' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations & Procedures Tab */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Operations & Procedures
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddProcedure}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Procedure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {procedures.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Surgeon</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedures.map((proc, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            placeholder="Procedure name"
                            value={proc.name}
                            onChange={(e) => handleProcedureChange(index, 'name', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={proc.date}
                            onChange={(e) => handleProcedureChange(index, 'date', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Surgeon"
                            value={proc.surgeon}
                            onChange={(e) => handleProcedureChange(index, 'surgeon', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Notes"
                            value={proc.notes}
                            onChange={(e) => handleProcedureChange(index, 'notes', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Outcome"
                            value={proc.outcome}
                            onChange={(e) => handleProcedureChange(index, 'outcome', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProcedure(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="space-y-2">
                <Label htmlFor="surgeon-notes">Surgeon Notes</Label>
                <Textarea
                  id="surgeon-notes"
                  placeholder="Enter surgeon notes..."
                  value={surgeonNotes}
                  onChange={(e) => setSurgeonNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProcedures}
                  disabled={savingSection === 'operations'}
                >
                  {savingSection === 'operations' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nursing Tab */}
        <TabsContent value="nursing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Nursing Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nursing-notes">Nursing Notes</Label>
                <Textarea
                  id="nursing-notes"
                  placeholder="Enter nursing notes..."
                  value={nursingNotes}
                  onChange={(e) => setNursingNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Vital Signs on Discharge</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="vitals-bp" className="text-xs">Blood Pressure</Label>
                    <Input
                      id="vitals-bp"
                      placeholder="e.g., 120/80"
                      value={vitalsBP}
                      onChange={(e) => setVitalsBP(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vitals-hr" className="text-xs">Heart Rate</Label>
                    <Input
                      id="vitals-hr"
                      placeholder="e.g., 72 bpm"
                      value={vitalsHR}
                      onChange={(e) => setVitalsHR(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vitals-temp" className="text-xs">Temperature</Label>
                    <Input
                      id="vitals-temp"
                      placeholder="e.g., 36.8C"
                      value={vitalsTemp}
                      onChange={(e) => setVitalsTemp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vitals-spo2" className="text-xs">SpO2</Label>
                    <Input
                      id="vitals-spo2"
                      placeholder="e.g., 98%"
                      value={vitalsSpO2}
                      onChange={(e) => setVitalsSpO2(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vitals-rr" className="text-xs">Respiratory Rate</Label>
                    <Input
                      id="vitals-rr"
                      placeholder="e.g., 16/min"
                      value={vitalsRR}
                      onChange={(e) => setVitalsRR(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dietary-instructions">Dietary Instructions</Label>
                <Textarea
                  id="dietary-instructions"
                  placeholder="Enter dietary instructions..."
                  value={dietaryInstructions}
                  onChange={(e) => setDietaryInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-restrictions">Activity Restrictions</Label>
                <Textarea
                  id="activity-restrictions"
                  placeholder="Enter activity restrictions..."
                  value={activityRestrictions}
                  onChange={(e) => setActivityRestrictions(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNursing}
                  disabled={savingSection === 'nursing'}
                >
                  {savingSection === 'nursing' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-up Tab */}
        <TabsContent value="followup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Follow-up Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="followup-instructions">Follow-up Instructions</Label>
                <Textarea
                  id="followup-instructions"
                  placeholder="Enter follow-up instructions..."
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="followup-date">Follow-up Date</Label>
                  <Input
                    id="followup-date"
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup-doctor">Follow-up Doctor</Label>
                  <Input
                    id="followup-doctor"
                    placeholder="Doctor name"
                    value={followUpDoctor}
                    onChange={(e) => setFollowUpDoctor(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-education">Patient Education Notes</Label>
                <Textarea
                  id="patient-education"
                  placeholder="Enter patient education notes..."
                  value={patientEducation}
                  onChange={(e) => setPatientEducation(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveFollowUp}
                  disabled={savingSection === 'followup'}
                >
                  {savingSection === 'followup' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete Discharge Confirmation Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Discharge</DialogTitle>
            <DialogDescription>
              Are you sure you want to complete the discharge for{' '}
              <span className="font-semibold">{form.patientName}</span>?
              This action will mark the discharge form as completed and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient:</span>
              <span className="font-medium">{form.patientName || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CHI Number:</span>
              <span className="font-mono">{form.patientChiNumber || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary Diagnosis:</span>
              <span className="font-medium">{form.primaryDiagnosis || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-medium">{form.version}</span>
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
    </div>
  );
}
