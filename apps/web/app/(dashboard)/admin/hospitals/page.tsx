'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { hospitalsApi } from '@/lib/api/hospitals';
import { useAuth } from '@/lib/auth/AuthContext';
import type {
  Hospital,
  Department,
  Ward,
  Bed,
  CreateHospitalDto,
  CreateDepartmentDto,
  CreateWardDto,
  CreateBedDto,
} from '@/lib/types/hospital';
import {
  Loader2,
  Building2,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BedDouble,
  Layers,
  DoorOpen,
} from 'lucide-react';

const ZIMBABWE_PROVINCES = [
  'Harare',
  'Bulawayo',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
];

const HOSPITAL_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'district', label: 'District' },
];

const WARD_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'surgical', label: 'Surgical' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'pediatric', label: 'Pediatric' },
  { value: 'icu', label: 'ICU' },
  { value: 'hdu', label: 'HDU' },
];

const BED_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'icu', label: 'ICU' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'pediatric', label: 'Pediatric' },
];

const BED_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reserved', label: 'Reserved' },
];

// Toast-like notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
      <Alert variant={type === 'success' ? 'success' : 'destructive'} className="shadow-lg min-w-[300px]">
        {type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}

// --- Hospital Form ---
function HospitalForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<CreateHospitalDto>;
  onSubmit: (data: CreateHospitalDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<CreateHospitalDto>({
    name: initial?.name || '',
    code: initial?.code || '',
    type: initial?.type || 'general',
    address: initial?.address || '',
    city: initial?.city || '',
    province: initial?.province || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    bedCapacity: initial?.bedCapacity || 0,
  });

  const set = (field: keyof CreateHospitalDto, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Hospital name" />
        </div>
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="HOS-001" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={form.type} onValueChange={(v) => set('type', v)}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {HOSPITAL_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Address *</Label>
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>City *</Label>
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
        </div>
        <div className="space-y-2">
          <Label>Province</Label>
          <Select value={form.province || ''} onValueChange={(v) => set('province', v)}>
            <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
            <SelectContent>
              {ZIMBABWE_PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+263..." />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="email@hospital.co.zw" type="email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bed Capacity</Label>
        <Input
          type="number"
          value={form.bedCapacity || ''}
          onChange={(e) => set('bedCapacity', parseInt(e.target.value) || 0)}
          placeholder="0"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// --- Department Form ---
function DepartmentForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<CreateDepartmentDto>;
  onSubmit: (data: CreateDepartmentDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<CreateDepartmentDto>({
    name: initial?.name || '',
    code: initial?.code || '',
    specialty: initial?.specialty || '',
    headOfDepartment: initial?.headOfDepartment || '',
    floor: initial?.floor || '',
    description: initial?.description || '',
  });

  const set = (field: keyof CreateDepartmentDto, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Department name" />
        </div>
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="DEPT-001" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Specialty</Label>
          <Input value={form.specialty || ''} onChange={(e) => set('specialty', e.target.value)} placeholder="e.g., Cardiology" />
        </div>
        <div className="space-y-2">
          <Label>Head of Department</Label>
          <Input value={form.headOfDepartment || ''} onChange={(e) => set('headOfDepartment', e.target.value)} placeholder="Dr. Name" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Floor</Label>
        <Input value={form.floor || ''} onChange={(e) => set('floor', e.target.value)} placeholder="e.g., 2nd Floor" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Brief description" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// --- Ward Form ---
function WardForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<CreateWardDto>;
  onSubmit: (data: CreateWardDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<CreateWardDto>({
    name: initial?.name || '',
    code: initial?.code || '',
    type: initial?.type || 'general',
    floor: initial?.floor || '',
    bedCapacity: initial?.bedCapacity || 0,
    nurseInCharge: initial?.nurseInCharge || '',
  });

  const set = (field: keyof CreateWardDto, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ward name" />
        </div>
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="WRD-001" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={form.type || 'general'} onValueChange={(v) => set('type', v)}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {WARD_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Floor</Label>
          <Input value={form.floor || ''} onChange={(e) => set('floor', e.target.value)} placeholder="e.g., 1st Floor" />
        </div>
        <div className="space-y-2">
          <Label>Bed Capacity</Label>
          <Input type="number" value={form.bedCapacity || ''} onChange={(e) => set('bedCapacity', parseInt(e.target.value) || 0)} placeholder="0" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nurse In Charge</Label>
        <Input value={form.nurseInCharge || ''} onChange={(e) => set('nurseInCharge', e.target.value)} placeholder="Nurse name" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// --- Bed Form ---
function BedForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<CreateBedDto>;
  onSubmit: (data: CreateBedDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<CreateBedDto>({
    bedNumber: initial?.bedNumber || '',
    type: initial?.type || 'standard',
    status: initial?.status || 'available',
  });

  const set = (field: keyof CreateBedDto, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Bed Number *</Label>
        <Input value={form.bedNumber} onChange={(e) => set('bedNumber', e.target.value)} placeholder="e.g., B-101" />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={form.type || 'standard'} onValueChange={(v) => set('type', v)}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {BED_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={form.status || 'available'} onValueChange={(v) => set('status', v)}>
          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            {BED_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// --- Bed status badge ---
function BedStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    available: 'default',
    occupied: 'destructive',
    maintenance: 'secondary',
    reserved: 'outline',
  };
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
}

// --- Bed Row ---
function BedRow({
  bed,
  wardId,
  onUpdate,
  onDelete,
}: {
  bed: Bed;
  wardId: string;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleEdit = async (data: CreateBedDto) => {
    setIsSubmitting(true);
    try {
      await hospitalsApi.updateBed(wardId, bed.id, data);
      setEditOpen(false);
      onUpdate();
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await hospitalsApi.deleteBed(wardId, bed.id);
      setDeleteConfirm(false);
      onDelete();
    } catch {
      // error handled by parent
    }
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-md">
      <div className="flex items-center gap-3">
        <BedDouble className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{bed.bedNumber}</span>
        <Badge variant="outline" className="text-xs">{bed.type}</Badge>
        <BedStatusBadge status={bed.status} />
      </div>
      <div className="flex items-center gap-1">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bed</DialogTitle>
              <DialogDescription>Update bed details.</DialogDescription>
            </DialogHeader>
            <BedForm
              initial={{ bedNumber: bed.bedNumber, type: bed.type, status: bed.status }}
              onSubmit={handleEdit}
              onCancel={() => setEditOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
        <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Bed</DialogTitle>
              <DialogDescription>Are you sure you want to delete bed {bed.bedNumber}? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// --- Ward Section ---
function WardSection({
  ward,
  hospitalId,
  departmentId,
  onRefresh,
  showToast,
}: {
  ward: Ward;
  hospitalId: string;
  departmentId: string;
  onRefresh: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [beds, setBeds] = useState<Bed[]>(ward.beds || []);
  const [bedsLoaded, setBedsLoaded] = useState(!!ward.beds);
  const [addBedOpen, setAddBedOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBeds = useCallback(async () => {
    try {
      const res = await hospitalsApi.getBeds(ward.id);
      setBeds(res.data || []);
      setBedsLoaded(true);
    } catch {
      setBeds([]);
      setBedsLoaded(true);
    }
  }, [ward.id]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !bedsLoaded) {
      loadBeds();
    }
  };

  const handleAddBed = async (data: CreateBedDto) => {
    setIsSubmitting(true);
    try {
      await hospitalsApi.createBed(ward.id, data);
      setAddBedOpen(false);
      showToast('Bed added successfully', 'success');
      loadBeds();
    } catch {
      showToast('Failed to add bed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWard = async (data: CreateWardDto) => {
    setIsSubmitting(true);
    try {
      await hospitalsApi.updateWard(hospitalId, departmentId, ward.id, data);
      setEditOpen(false);
      showToast('Ward updated successfully', 'success');
      onRefresh();
    } catch {
      showToast('Failed to update ward', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWard = async () => {
    try {
      await hospitalsApi.deleteWard(hospitalId, departmentId, ward.id);
      setDeleteConfirm(false);
      showToast('Ward deleted successfully', 'success');
      onRefresh();
    } catch {
      showToast('Failed to delete ward', 'error');
    }
  };

  return (
    <div className="border rounded-lg ml-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-3">
          <CollapsibleTrigger asChild>
            <button onClick={handleToggle} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
              {ward.name}
              <Badge variant="outline" className="text-xs ml-1">{ward.code}</Badge>
              <Badge variant="secondary" className="text-xs">{ward.type}</Badge>
              <span className="text-xs text-muted-foreground">({ward.currentOccupancy}/{ward.bedCapacity} beds)</span>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Dialog open={addBedOpen} onOpenChange={setAddBedOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Bed</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bed to {ward.name}</DialogTitle>
                  <DialogDescription>Add a new bed to this ward.</DialogDescription>
                </DialogHeader>
                <BedForm onSubmit={handleAddBed} onCancel={() => setAddBedOpen(false)} isSubmitting={isSubmitting} />
              </DialogContent>
            </Dialog>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Ward</DialogTitle>
                  <DialogDescription>Update ward details.</DialogDescription>
                </DialogHeader>
                <WardForm
                  initial={{ name: ward.name, code: ward.code, type: ward.type, floor: ward.floor || '', bedCapacity: ward.bedCapacity, nurseInCharge: ward.nurseInCharge || '' }}
                  onSubmit={handleEditWard}
                  onCancel={() => setEditOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Ward</DialogTitle>
                  <DialogDescription>Are you sure you want to delete ward &quot;{ward.name}&quot;? This will also remove all associated beds.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteWard}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {ward.nurseInCharge && (
              <p className="text-xs text-muted-foreground">Nurse In Charge: {ward.nurseInCharge}</p>
            )}
            {beds.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No beds in this ward yet.</p>
            ) : (
              <div className="space-y-1">
                {beds.map((bed) => (
                  <BedRow key={bed.id} bed={bed} wardId={ward.id} onUpdate={loadBeds} onDelete={loadBeds} />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// --- Department Section ---
function DepartmentSection({
  department,
  hospitalId,
  onRefresh,
  showToast,
}: {
  department: Department;
  hospitalId: string;
  onRefresh: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [wards, setWards] = useState<Ward[]>(department.wards || []);
  const [wardsLoaded, setWardsLoaded] = useState(!!department.wards);
  const [addWardOpen, setAddWardOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWards = useCallback(async () => {
    try {
      const res = await hospitalsApi.getWards(hospitalId, department.id);
      setWards(res.data || []);
      setWardsLoaded(true);
    } catch {
      setWards([]);
      setWardsLoaded(true);
    }
  }, [hospitalId, department.id]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !wardsLoaded) {
      loadWards();
    }
  };

  const handleAddWard = async (data: CreateWardDto) => {
    setIsSubmitting(true);
    try {
      await hospitalsApi.createWard(hospitalId, department.id, data);
      setAddWardOpen(false);
      showToast('Ward added successfully', 'success');
      loadWards();
    } catch {
      showToast('Failed to add ward', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDepartment = async (data: CreateDepartmentDto) => {
    setIsSubmitting(true);
    try {
      await hospitalsApi.updateDepartment(hospitalId, department.id, data);
      setEditOpen(false);
      showToast('Department updated successfully', 'success');
      onRefresh();
    } catch {
      showToast('Failed to update department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    try {
      await hospitalsApi.deleteDepartment(hospitalId, department.id);
      setDeleteConfirm(false);
      showToast('Department deleted successfully', 'success');
      onRefresh();
    } catch {
      showToast('Failed to delete department', 'error');
    }
  };

  return (
    <div className="border rounded-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-3">
          <CollapsibleTrigger asChild>
            <button onClick={handleToggle} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Layers className="h-4 w-4 text-muted-foreground" />
              {department.name}
              <Badge variant="outline" className="text-xs ml-1">{department.code}</Badge>
              {department.specialty && <span className="text-xs text-muted-foreground">({department.specialty})</span>}
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Dialog open={addWardOpen} onOpenChange={setAddWardOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Ward</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Ward to {department.name}</DialogTitle>
                  <DialogDescription>Add a new ward to this department.</DialogDescription>
                </DialogHeader>
                <WardForm onSubmit={handleAddWard} onCancel={() => setAddWardOpen(false)} isSubmitting={isSubmitting} />
              </DialogContent>
            </Dialog>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Department</DialogTitle>
                  <DialogDescription>Update department details.</DialogDescription>
                </DialogHeader>
                <DepartmentForm
                  initial={{
                    name: department.name,
                    code: department.code,
                    specialty: department.specialty || '',
                    headOfDepartment: department.headOfDepartment || '',
                    floor: department.floor || '',
                    description: department.description || '',
                  }}
                  onSubmit={handleEditDepartment}
                  onCancel={() => setEditOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Department</DialogTitle>
                  <DialogDescription>Are you sure you want to delete department &quot;{department.name}&quot;? This will also remove all associated wards and beds.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteDepartment}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {department.headOfDepartment && (
              <p className="text-xs text-muted-foreground">Head: {department.headOfDepartment}</p>
            )}
            {department.floor && (
              <p className="text-xs text-muted-foreground">Floor: {department.floor}</p>
            )}
            {wards.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No wards in this department yet.</p>
            ) : (
              <div className="space-y-2">
                {wards.map((ward) => (
                  <WardSection
                    key={ward.id}
                    ward={ward}
                    hospitalId={hospitalId}
                    departmentId={department.id}
                    onRefresh={loadWards}
                    showToast={showToast}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// --- Hospital Card ---
function HospitalCard({
  hospital,
  onRefresh,
  showToast,
}: {
  hospital: Hospital;
  onRefresh: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>(hospital.departments || []);
  const [deptsLoaded, setDeptsLoaded] = useState(!!hospital.departments);
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await hospitalsApi.getDepartments(hospital.id);
      setDepartments(res.data || []);
      setDeptsLoaded(true);
    } catch {
      setDepartments([]);
      setDeptsLoaded(true);
    }
  }, [hospital.id]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !deptsLoaded) {
      loadDepartments();
    }
  };

  const handleAddDepartment = async (data: CreateDepartmentDto) => {
    setIsSubmitting(true);
    try {
      await hospitalsApi.createDepartment(hospital.id, data);
      setAddDeptOpen(false);
      showToast('Department added successfully', 'success');
      loadDepartments();
    } catch {
      showToast('Failed to add department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHospital = async (data: CreateHospitalDto) => {
    setIsSubmitting(true);
    try {
      await hospitalsApi.update(hospital.id, data);
      setEditOpen(false);
      showToast('Hospital updated successfully', 'success');
      onRefresh();
    } catch {
      showToast('Failed to update hospital', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHospital = async () => {
    try {
      await hospitalsApi.delete(hospital.id);
      setDeleteConfirm(false);
      showToast('Hospital deleted successfully', 'success');
      onRefresh();
    } catch {
      showToast('Failed to delete hospital', 'error');
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button onClick={handleToggle} className="flex items-center gap-3 text-left hover:text-primary transition-colors">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {hospital.name}
                    <Badge variant="outline">{hospital.code}</Badge>
                    <Badge variant={hospital.isActive ? 'default' : 'destructive'}>
                      {hospital.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {hospital.address}, {hospital.city}{hospital.province ? `, ${hospital.province}` : ''}
                    {' '} | Type: {hospital.type} | Beds: {hospital.bedCapacity}
                  </CardDescription>
                </div>
              </button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Department</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Department to {hospital.name}</DialogTitle>
                    <DialogDescription>Create a new department within this hospital.</DialogDescription>
                  </DialogHeader>
                  <DepartmentForm onSubmit={handleAddDepartment} onCancel={() => setAddDeptOpen(false)} isSubmitting={isSubmitting} />
                </DialogContent>
              </Dialog>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Edit Hospital</DialogTitle>
                    <DialogDescription>Update hospital details.</DialogDescription>
                  </DialogHeader>
                  <HospitalForm
                    initial={{
                      name: hospital.name,
                      code: hospital.code,
                      type: hospital.type,
                      address: hospital.address,
                      city: hospital.city,
                      province: hospital.province,
                      phone: hospital.phone || '',
                      email: hospital.email || '',
                      bedCapacity: hospital.bedCapacity,
                    }}
                    onSubmit={handleEditHospital}
                    onCancel={() => setEditOpen(false)}
                    isSubmitting={isSubmitting}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Hospital</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{hospital.name}&quot;? This will remove all departments, wards, and beds associated with this hospital. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteHospital}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg text-sm">
                {hospital.phone && <div><span className="text-muted-foreground">Phone:</span> {hospital.phone}</div>}
                {hospital.email && <div><span className="text-muted-foreground">Email:</span> {hospital.email}</div>}
                <div><span className="text-muted-foreground">Province:</span> {hospital.province || 'N/A'}</div>
                <div><span className="text-muted-foreground">Capacity:</span> {hospital.bedCapacity} beds</div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Departments ({departments.length})</h4>
                {departments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No departments yet. Add one to get started.</p>
                ) : (
                  departments.map((dept) => (
                    <DepartmentSection
                      key={dept.id}
                      department={dept}
                      hospitalId={hospital.id}
                      onRefresh={loadDepartments}
                      showToast={showToast}
                    />
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// === Main Page Component ===
export default function HospitalManagementPage() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addHospitalOpen, setAddHospitalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const fetchHospitals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await hospitalsApi.findAll();
      setHospitals(response.data || []);
    } catch {
      setHospitals([]);
      showToast('Failed to load hospitals', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleAddHospital = async (data: CreateHospitalDto) => {
    setIsSubmitting(true);
    try {
      await hospitalsApi.create({ ...data, country: 'Zimbabwe' });
      setAddHospitalOpen(false);
      showToast('Hospital created successfully', 'success');
      fetchHospitals();
    } catch {
      showToast('Failed to create hospital', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin-only access check
  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="rounded-full bg-destructive/10 p-6 mb-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 max-w-md">
          You do not have permission to access Hospital Management. This page is restricted to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Management</h1>
          <p className="text-muted-foreground">
            Manage hospitals, departments, wards, and beds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchHospitals} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={addHospitalOpen} onOpenChange={setAddHospitalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Hospital
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Hospital</DialogTitle>
                <DialogDescription>Register a new hospital in the system.</DialogDescription>
              </DialogHeader>
              <HospitalForm
                onSubmit={handleAddHospital}
                onCancel={() => setAddHospitalOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : hospitals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Hospitals</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first hospital.</p>
            <Button onClick={() => setAddHospitalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Hospital
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hospitals.map((hospital) => (
            <HospitalCard
              key={hospital.id}
              hospital={hospital}
              onRefresh={fetchHospitals}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
