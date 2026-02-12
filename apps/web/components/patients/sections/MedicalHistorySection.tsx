'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { patientsApi } from '@/lib/api/patients';
import type { MedicalHistory, CreateMedicalHistoryDto, MedicalHistoryType, MedicalHistoryStatus } from '@/lib/types/patient';
import { Plus, Edit, Trash2, Loader2, FileText, Activity, Stethoscope, Users, Syringe } from 'lucide-react';
import { SnomedSearchInput } from '@/components/shared/snomed-search-input';
import { Combobox } from '@/components/ui/combobox';
import { ICD10_COMMON_CODES } from '@/lib/data/icd10-common';

interface MedicalHistorySectionProps {
  patientId: string;
  initialData: MedicalHistory[];
  onCountChange?: (count: number) => void;
}

const typeOptions: { value: MedicalHistoryType; label: string; icon: any }[] = [
  { value: 'condition', label: 'Medical Condition', icon: Activity },
  { value: 'surgery', label: 'Surgery', icon: Stethoscope },
  { value: 'hospitalization', label: 'Hospitalization', icon: FileText },
  { value: 'family_history', label: 'Family History', icon: Users },
  { value: 'immunization', label: 'Immunization', icon: Syringe },
  { value: 'other', label: 'Other', icon: FileText },
];

const statusOptions: { value: MedicalHistoryStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-red-100 text-red-800' },
  { value: 'chronic', label: 'Chronic', color: 'bg-orange-100 text-orange-800' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  { value: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-800' },
];

export function MedicalHistorySection({ patientId, initialData, onCountChange }: MedicalHistorySectionProps) {
  const [items, setItems] = useState<MedicalHistory[]>(initialData);

  // Update count when items change
  const updateItems = (newItems: MedicalHistory[]) => {
    setItems(newItems);
    onCountChange?.(newItems.length);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicalHistory | null>(null);
  const [formData, setFormData] = useState<CreateMedicalHistoryDto>({
    type: 'condition',
    title: '',
    description: '',
    icdCode: '',
    onsetDate: '',
    resolutionDate: '',
    status: 'unknown',
    diagnosedBy: '',
    treatmentNotes: '',
    familyMemberRelation: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'condition',
      title: '',
      description: '',
      icdCode: '',
      onsetDate: '',
      resolutionDate: '',
      status: 'unknown',
      diagnosedBy: '',
      treatmentNotes: '',
      familyMemberRelation: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const openDialog = (item?: MedicalHistory) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        type: item.type,
        title: item.title,
        description: item.description || '',
        icdCode: item.icdCode || '',
        onsetDate: item.onsetDate?.split('T')[0] || '',
        resolutionDate: item.resolutionDate?.split('T')[0] || '',
        status: item.status,
        diagnosedBy: item.diagnosedBy || '',
        treatmentNotes: item.treatmentNotes || '',
        familyMemberRelation: item.familyMemberRelation || '',
        notes: item.notes || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Clean up empty strings to avoid validation errors
      const cleanedData: CreateMedicalHistoryDto = {
        title: formData.title,
        type: formData.type,
        status: formData.status,
        ...(formData.description && { description: formData.description }),
        ...(formData.icdCode && { icdCode: formData.icdCode }),
        ...(formData.onsetDate && { onsetDate: formData.onsetDate }),
        ...(formData.resolutionDate && { resolutionDate: formData.resolutionDate }),
        ...(formData.diagnosedBy && { diagnosedBy: formData.diagnosedBy }),
        ...(formData.treatmentNotes && { treatmentNotes: formData.treatmentNotes }),
        ...(formData.familyMemberRelation && { familyMemberRelation: formData.familyMemberRelation }),
        ...(formData.notes && { notes: formData.notes }),
      };

      if (editingItem) {
        const response = await patientsApi.updateMedicalHistory(patientId, editingItem.id, cleanedData);
        updateItems(items.map((i) => (i.id === editingItem.id ? response.data : i)));
      } else {
        const response = await patientsApi.addMedicalHistory(patientId, cleanedData);
        updateItems([...items, response.data]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save medical history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this record?')) return;
    try {
      await patientsApi.removeMedicalHistory(patientId, id);
      updateItems(items.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Failed to delete medical history:', error);
    }
  };

  const getStatusBadge = (status: MedicalHistoryStatus) => {
    const opt = statusOptions.find((o) => o.value === status);
    return opt ? (
      <Badge className={opt.color}>{opt.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
  };

  const getTypeIcon = (type: MedicalHistoryType) => {
    const opt = typeOptions.find((o) => o.value === type);
    const Icon = opt?.icon || FileText;
    return <Icon className="h-5 w-5 text-muted-foreground" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Medical History</h3>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No medical history recorded. Click "Add Record" to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.type)}
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      {item.icdCode && (
                        <p className="text-sm text-muted-foreground">ICD: {item.icdCode}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openDialog(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {getStatusBadge(item.status)}
                  <Badge variant="outline" className="capitalize">
                    {item.type.replace('_', ' ')}
                  </Badge>
                  {item.onsetDate && (
                    <Badge variant="secondary">Onset: {formatDate(item.onsetDate)}</Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                {item.familyMemberRelation && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Family Member:</strong> {item.familyMemberRelation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Medical History' : 'Add Medical History'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as MedicalHistoryType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as MedicalHistoryStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <SnomedSearchInput
                value={formData.title}
                onValueChange={(value) => setFormData({ ...formData, title: value })}
                searchType="clinicalFindings"
                allowFreeText
                placeholder="Search conditions..."
              />
            </div>
            <div className="space-y-2">
              <Label>ICD Code</Label>
              <Combobox
                value={formData.icdCode}
                onValueChange={(value) => setFormData({ ...formData, icdCode: value })}
                options={ICD10_COMMON_CODES}
                allowFreeText
                placeholder="Search ICD-10 codes..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Onset Date</Label>
                <Input
                  type="date"
                  value={formData.onsetDate}
                  onChange={(e) => setFormData({ ...formData, onsetDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Resolution Date</Label>
                <Input
                  type="date"
                  value={formData.resolutionDate}
                  onChange={(e) => setFormData({ ...formData, resolutionDate: e.target.value })}
                />
              </div>
            </div>
            {formData.type === 'family_history' && (
              <div className="space-y-2">
                <Label>Family Member Relation</Label>
                <Input
                  value={formData.familyMemberRelation}
                  onChange={(e) => setFormData({ ...formData, familyMemberRelation: e.target.value })}
                  placeholder="e.g., Mother, Father, Sibling"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Treatment Notes</Label>
              <Textarea
                value={formData.treatmentNotes}
                onChange={(e) => setFormData({ ...formData, treatmentNotes: e.target.value })}
                placeholder="Treatment details..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !formData.title}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Add Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
