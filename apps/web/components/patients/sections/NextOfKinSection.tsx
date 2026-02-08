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
import type { NextOfKin, CreateNextOfKinDto, RelationshipType } from '@/lib/types/patient';
import { Plus, Edit, Trash2, Loader2, Phone, Mail, User, Star } from 'lucide-react';

interface NextOfKinSectionProps {
  patientId: string;
  initialData: NextOfKin[];
  onCountChange?: (count: number) => void;
}

const relationshipOptions: { value: RelationshipType; label: string }[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle' },
  { value: 'niece_nephew', label: 'Niece/Nephew' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'friend', label: 'Friend' },
  { value: 'partner', label: 'Partner' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

export function NextOfKinSection({ patientId, initialData, onCountChange }: NextOfKinSectionProps) {
  const [items, setItems] = useState<NextOfKin[]>(initialData);

  // Update count when items change
  const updateItems = (newItems: NextOfKin[]) => {
    setItems(newItems);
    onCountChange?.(newItems.length);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<NextOfKin | null>(null);
  const [formData, setFormData] = useState<CreateNextOfKinDto>({
    firstName: '',
    lastName: '',
    relationship: 'other',
    phonePrimary: '',
    phoneSecondary: '',
    email: '',
    addressLine1: '',
    city: '',
    postCode: '',
    isPrimaryContact: false,
    isEmergencyContact: true,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      relationship: 'other',
      phonePrimary: '',
      phoneSecondary: '',
      email: '',
      addressLine1: '',
      city: '',
      postCode: '',
      isPrimaryContact: false,
      isEmergencyContact: true,
      notes: '',
    });
    setEditingItem(null);
  };

  const openDialog = (item?: NextOfKin) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        firstName: item.firstName,
        lastName: item.lastName,
        relationship: item.relationship,
        phonePrimary: item.phonePrimary,
        phoneSecondary: item.phoneSecondary || '',
        email: item.email || '',
        addressLine1: item.addressLine1 || '',
        city: item.city || '',
        postCode: item.postCode || '',
        isPrimaryContact: item.isPrimaryContact,
        isEmergencyContact: item.isEmergencyContact,
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
      const cleanedData: CreateNextOfKinDto = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phonePrimary: formData.phonePrimary,
        relationship: formData.relationship,
        isPrimaryContact: formData.isPrimaryContact,
        isEmergencyContact: formData.isEmergencyContact,
        ...(formData.phoneSecondary && { phoneSecondary: formData.phoneSecondary }),
        ...(formData.email && { email: formData.email }),
        ...(formData.addressLine1 && { addressLine1: formData.addressLine1 }),
        ...(formData.addressLine2 && { addressLine2: formData.addressLine2 }),
        ...(formData.city && { city: formData.city }),
        ...(formData.postCode && { postCode: formData.postCode }),
        ...(formData.notes && { notes: formData.notes }),
      };

      if (editingItem) {
        const response = await patientsApi.updateNextOfKin(patientId, editingItem.id, cleanedData);
        updateItems(items.map((i) => (i.id === editingItem.id ? response.data : i)));
      } else {
        const response = await patientsApi.addNextOfKin(patientId, cleanedData);
        updateItems([...items, response.data]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save next of kin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;
    try {
      await patientsApi.removeNextOfKin(patientId, id);
      updateItems(items.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Failed to delete next of kin:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Emergency Contacts & Next of Kin</h3>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No emergency contacts added yet. Click "Add Contact" to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">
                      {item.firstName} {item.lastName}
                    </CardTitle>
                    {item.isPrimaryContact && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
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
                <Badge variant="outline" className="capitalize">
                  {item.relationship.replace('_', ' ')}
                </Badge>
                {item.isEmergencyContact && (
                  <Badge variant="destructive" className="ml-2">Emergency</Badge>
                )}
                <div className="text-sm space-y-1 mt-2">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {item.phonePrimary}
                  </p>
                  {item.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {item.email}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Contact' : 'Add Emergency Contact'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) => setFormData({ ...formData, relationship: value as RelationshipType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Phone *</Label>
                <Input
                  type="tel"
                  pattern="^(\+263|0)\d{9}$"
                  title="Enter a valid Zimbabwean phone number (e.g. 0771234567 or +263771234567)"
                  value={formData.phonePrimary}
                  onChange={(e) => setFormData({ ...formData, phonePrimary: e.target.value })}
                  placeholder="0771234567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane.doe@email.com"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isPrimaryContact}
                  onChange={(e) => setFormData({ ...formData, isPrimaryContact: e.target.checked })}
                  className="rounded"
                />
                Primary Contact
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isEmergencyContact}
                  onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                  className="rounded"
                />
                Emergency Contact
              </label>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !formData.firstName || !formData.lastName || !formData.phonePrimary}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
