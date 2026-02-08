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
import type { Allergy, CreateAllergyDto, AllergyType, AllergySeverity, AllergyStatus } from '@/lib/types/patient';
import { Combobox } from '@/components/ui/combobox';
import { ALLERGENS } from '@/lib/data/medical-terms';
import { Plus, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface AllergiesSectionProps {
  patientId: string;
  initialData: Allergy[];
  onCountChange?: (count: number) => void;
}

const allergyTypeOptions: { value: AllergyType; label: string }[] = [
  { value: 'drug', label: 'Drug' },
  { value: 'food', label: 'Food' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'other', label: 'Other' },
];

const severityOptions: { value: AllergySeverity; label: string; color: string }[] = [
  { value: 'mild', label: 'Mild', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'moderate', label: 'Moderate', color: 'bg-orange-100 text-orange-800' },
  { value: 'severe', label: 'Severe', color: 'bg-red-100 text-red-800' },
  { value: 'life_threatening', label: 'Life Threatening', color: 'bg-red-600 text-white' },
  { value: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-800' },
];

const statusOptions: { value: AllergyStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'resolved', label: 'Resolved' },
];

export function AllergiesSection({ patientId, initialData, onCountChange }: AllergiesSectionProps) {
  const [items, setItems] = useState<Allergy[]>(initialData);

  // Update count when items change
  const updateItems = (newItems: Allergy[]) => {
    setItems(newItems);
    onCountChange?.(newItems.length);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Allergy | null>(null);
  const [formData, setFormData] = useState<CreateAllergyDto>({
    allergenName: '',
    allergyType: 'other',
    severity: 'unknown',
    reaction: '',
    onsetDate: '',
    diagnosedDate: '',
    diagnosedBy: '',
    status: 'active',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      allergenName: '',
      allergyType: 'other',
      severity: 'unknown',
      reaction: '',
      onsetDate: '',
      diagnosedDate: '',
      diagnosedBy: '',
      status: 'active',
      notes: '',
    });
    setEditingItem(null);
  };

  const openDialog = (item?: Allergy) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        allergenName: item.allergenName,
        allergyType: item.allergyType,
        severity: item.severity,
        reaction: item.reaction || '',
        onsetDate: item.onsetDate?.split('T')[0] || '',
        diagnosedDate: item.diagnosedDate?.split('T')[0] || '',
        diagnosedBy: item.diagnosedBy || '',
        status: item.status,
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
      const cleanedData: CreateAllergyDto = {
        allergenName: formData.allergenName,
        allergyType: formData.allergyType,
        severity: formData.severity,
        status: formData.status,
        ...(formData.reaction && { reaction: formData.reaction }),
        ...(formData.onsetDate && { onsetDate: formData.onsetDate }),
        ...(formData.diagnosedDate && { diagnosedDate: formData.diagnosedDate }),
        ...(formData.diagnosedBy && { diagnosedBy: formData.diagnosedBy }),
        ...(formData.notes && { notes: formData.notes }),
      };

      if (editingItem) {
        const response = await patientsApi.updateAllergy(patientId, editingItem.id, cleanedData);
        updateItems(items.map((i) => (i.id === editingItem.id ? response.data : i)));
      } else {
        const response = await patientsApi.addAllergy(patientId, cleanedData);
        updateItems([...items, response.data]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save allergy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this allergy?')) return;
    try {
      await patientsApi.removeAllergy(patientId, id);
      updateItems(items.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Failed to delete allergy:', error);
    }
  };

  const getSeverityBadge = (severity: AllergySeverity) => {
    const opt = severityOptions.find((o) => o.value === severity);
    return opt ? (
      <Badge className={opt.color}>{opt.label}</Badge>
    ) : (
      <Badge variant="outline">{severity}</Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Allergies</h3>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Allergy
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No allergies recorded. Click "Add Allergy" to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className={item.severity === 'life_threatening' ? 'border-red-500' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${item.severity === 'life_threatening' ? 'text-red-600' : 'text-orange-500'}`} />
                    <CardTitle className="text-base">{item.allergenName}</CardTitle>
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
                  {getSeverityBadge(item.severity)}
                  <Badge variant="outline" className="capitalize">
                    {item.allergyType}
                  </Badge>
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {item.status}
                  </Badge>
                </div>
                {item.reaction && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Reaction:</strong> {item.reaction}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Allergy' : 'Add Allergy'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Allergen Name *</Label>
              <Combobox
                value={formData.allergenName}
                onChange={(value) => setFormData({ ...formData, allergenName: value })}
                items={ALLERGENS}
                placeholder="Search or type allergen..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.allergyType}
                  onValueChange={(value) => setFormData({ ...formData, allergyType: value as AllergyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allergyTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value as AllergySeverity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reaction</Label>
              <Textarea
                value={formData.reaction}
                onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                placeholder="Describe the allergic reaction..."
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
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as AllergyStatus })}
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
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !formData.allergenName}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Add Allergy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
