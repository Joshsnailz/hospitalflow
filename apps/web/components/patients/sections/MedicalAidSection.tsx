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
import type { MedicalAid, CreateMedicalAidDto, MedicalAidStatus } from '@/lib/types/patient';
import { Plus, Edit, Trash2, Loader2, CreditCard, Star, Calendar, Phone, Mail } from 'lucide-react';

interface MedicalAidSectionProps {
  patientId: string;
  initialData: MedicalAid[];
  onCountChange?: (count: number) => void;
}

const statusOptions: { value: MedicalAidStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
];

export function MedicalAidSection({ patientId, initialData, onCountChange }: MedicalAidSectionProps) {
  const [items, setItems] = useState<MedicalAid[]>(initialData);

  // Update count when items change
  const updateItems = (newItems: MedicalAid[]) => {
    setItems(newItems);
    onCountChange?.(newItems.length);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicalAid | null>(null);
  const [formData, setFormData] = useState<CreateMedicalAidDto>({
    providerName: '',
    planName: '',
    membershipNumber: '',
    groupNumber: '',
    policyHolderName: '',
    policyHolderRelationship: '',
    effectiveDate: '',
    expiryDate: '',
    status: 'active',
    isPrimary: true,
    contactPhone: '',
    contactEmail: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      providerName: '',
      planName: '',
      membershipNumber: '',
      groupNumber: '',
      policyHolderName: '',
      policyHolderRelationship: '',
      effectiveDate: '',
      expiryDate: '',
      status: 'active',
      isPrimary: items.length === 0,
      contactPhone: '',
      contactEmail: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const openDialog = (item?: MedicalAid) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        providerName: item.providerName,
        planName: item.planName || '',
        membershipNumber: item.membershipNumber,
        groupNumber: item.groupNumber || '',
        policyHolderName: item.policyHolderName || '',
        policyHolderRelationship: item.policyHolderRelationship || '',
        effectiveDate: item.effectiveDate?.split('T')[0] || '',
        expiryDate: item.expiryDate?.split('T')[0] || '',
        status: item.status,
        isPrimary: item.isPrimary,
        contactPhone: item.contactPhone || '',
        contactEmail: item.contactEmail || '',
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
      const cleanedData: CreateMedicalAidDto = {
        providerName: formData.providerName,
        membershipNumber: formData.membershipNumber,
        status: formData.status,
        isPrimary: formData.isPrimary,
        ...(formData.planName && { planName: formData.planName }),
        ...(formData.groupNumber && { groupNumber: formData.groupNumber }),
        ...(formData.policyHolderName && { policyHolderName: formData.policyHolderName }),
        ...(formData.policyHolderRelationship && { policyHolderRelationship: formData.policyHolderRelationship }),
        ...(formData.effectiveDate && { effectiveDate: formData.effectiveDate }),
        ...(formData.expiryDate && { expiryDate: formData.expiryDate }),
        ...(formData.contactPhone && { contactPhone: formData.contactPhone }),
        ...(formData.contactEmail && { contactEmail: formData.contactEmail }),
        ...(formData.notes && { notes: formData.notes }),
      };

      if (editingItem) {
        const response = await patientsApi.updateMedicalAid(patientId, editingItem.id, cleanedData);
        updateItems(items.map((i) => (i.id === editingItem.id ? response.data : i)));
      } else {
        const response = await patientsApi.addMedicalAid(patientId, cleanedData);
        updateItems([...items, response.data]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save medical aid:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this medical aid record?')) return;
    try {
      await patientsApi.removeMedicalAid(patientId, id);
      updateItems(items.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Failed to delete medical aid:', error);
    }
  };

  const getStatusBadge = (status: MedicalAidStatus) => {
    const opt = statusOptions.find((o) => o.value === status);
    return opt ? (
      <Badge className={opt.color}>{opt.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
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
        <h3 className="text-lg font-medium">Medical Aid / Insurance</h3>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Medical Aid
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No medical aid records. Click "Add Medical Aid" to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className={item.isPrimary ? 'border-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {item.providerName}
                        {item.isPrimary && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </CardTitle>
                      {item.planName && (
                        <p className="text-sm text-muted-foreground">{item.planName}</p>
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
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {getStatusBadge(item.status)}
                  {item.isPrimary && <Badge variant="default">Primary</Badge>}
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Member #:</strong> {item.membershipNumber}</p>
                  {item.groupNumber && <p><strong>Group #:</strong> {item.groupNumber}</p>}
                  {item.expiryDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Expires: {formatDate(item.expiryDate)}
                    </p>
                  )}
                  {item.contactPhone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {item.contactPhone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Medical Aid' : 'Add Medical Aid'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider Name *</Label>
                <Input
                  value={formData.providerName}
                  onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                  placeholder="e.g., BUPA, AXA"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  placeholder="e.g., Gold Plan"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Membership Number *</Label>
                <Input
                  value={formData.membershipNumber}
                  onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                  placeholder="MEM123456789"
                />
              </div>
              <div className="space-y-2">
                <Label>Group Number</Label>
                <Input
                  value={formData.groupNumber}
                  onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                  placeholder="GRP001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Policy Holder Name</Label>
                <Input
                  value={formData.policyHolderName}
                  onChange={(e) => setFormData({ ...formData, policyHolderName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship to Patient</Label>
                <Input
                  value={formData.policyHolderRelationship}
                  onChange={(e) => setFormData({ ...formData, policyHolderRelationship: e.target.value })}
                  placeholder="Self, Spouse, Parent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as MedicalAidStatus })}
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
              <div className="space-y-2 flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="rounded"
                  />
                  Primary Insurance
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+441234567890"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="support@provider.com"
                />
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
            <Button onClick={handleSubmit} disabled={isLoading || !formData.providerName || !formData.membershipNumber}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Add Medical Aid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
