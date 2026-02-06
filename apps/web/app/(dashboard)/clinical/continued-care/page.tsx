'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { clinicalApi } from '@/lib/api/clinical';
import type {
  CarePlan,
  CarePlanStatus,
  CarePlanGoal,
  CreateCarePlanDto,
} from '@/lib/types/clinical';
import { Loader2, HeartPulse, Plus, RefreshCw } from 'lucide-react';

const STATUS_OPTIONS: { value: CarePlanStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CATEGORY_OPTIONS = [
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'chronic_disease', label: 'Chronic Disease' },
  { value: 'post_operative', label: 'Post-Operative' },
  { value: 'palliative', label: 'Palliative' },
  { value: 'mental_health', label: 'Mental Health' },
];

const CATEGORY_LABELS: Record<string, string> = {
  rehabilitation: 'Rehabilitation',
  chronic_disease: 'Chronic Disease',
  post_operative: 'Post-Operative',
  palliative: 'Palliative',
  mental_health: 'Mental Health',
};

function getStatusBadge(status: CarePlanStatus) {
  switch (status) {
    case 'active':
      return <Badge variant="success">{status}</Badge>;
    case 'completed':
      return <Badge variant="info">{status}</Badge>;
    case 'on_hold':
      return <Badge variant="warning">On Hold</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getCategoryBadge(category: string) {
  const label = CATEGORY_LABELS[category] || category;
  switch (category) {
    case 'rehabilitation':
      return <Badge variant="info">{label}</Badge>;
    case 'chronic_disease':
      return <Badge className="border-transparent bg-purple-100 text-purple-700">{label}</Badge>;
    case 'post_operative':
      return <Badge className="border-transparent bg-orange-100 text-orange-700">{label}</Badge>;
    case 'palliative':
      return <Badge variant="secondary">{label}</Badge>;
    case 'mental_health':
      return <Badge className="border-transparent bg-teal-100 text-teal-700">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}

interface CarePlanForm {
  patientId: string;
  title: string;
  category: string;
  description: string;
  startDate: string;
  endDate: string;
  reviewDate: string;
  goalsText: string;
  assignedTo: string;
  notes: string;
}

const initialFormState: CarePlanForm = {
  patientId: '',
  title: '',
  category: '',
  description: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  reviewDate: '',
  goalsText: '',
  assignedTo: '',
  notes: '',
};

export default function ContinuedCarePage() {
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CarePlanForm>(initialFormState);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCarePlans();
  }, []);

  const fetchCarePlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clinicalApi.getCarePlans();
      setCarePlans(response.data || []);
    } catch (err) {
      console.error('Failed to fetch care plans:', err);
      setError('Failed to load care plans. Please try again.');
      setCarePlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CarePlanForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const validateForm = (): boolean => {
    if (!formData.patientId.trim()) {
      setFormError('Patient ID is required');
      return false;
    }
    if (!formData.title.trim()) {
      setFormError('Plan title is required');
      return false;
    }
    if (!formData.category) {
      setFormError('Category is required');
      return false;
    }
    if (!formData.startDate) {
      setFormError('Start date is required');
      return false;
    }
    return true;
  };

  const parseGoals = (text: string): CarePlanGoal[] | undefined => {
    if (!text.trim()) return undefined;
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map(line => ({
      description: line.trim(),
      targetDate: formData.reviewDate || formData.endDate || formData.startDate,
      status: 'pending' as const,
      notes: '',
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const createData: CreateCarePlanDto = {
        patientId: formData.patientId.trim(),
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        reviewDate: formData.reviewDate || undefined,
        goals: parseGoals(formData.goalsText),
        assignedTo: formData.assignedTo.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await clinicalApi.createCarePlan(createData);
      setIsDialogOpen(false);
      setFormData(initialFormState);
      fetchCarePlans();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create care plan';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormState);
    setFormError('');
  };

  const filteredPlans = carePlans.filter(plan => {
    if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && plan.category !== categoryFilter) return false;
    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Continued Care</h1>
          <p className="text-muted-foreground">
            Manage ongoing care plans and patient treatment coordination
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setIsDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Care Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Care Plan</DialogTitle>
              <DialogDescription>
                Set up a new care plan for a patient.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID *</Label>
                <Input
                  id="patientId"
                  placeholder="Search or enter patient ID"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Plan Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Post-Knee Replacement Rehabilitation"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the care plan objectives and scope"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewDate">Review Date</Label>
                  <Input
                    id="reviewDate"
                    type="date"
                    value={formData.reviewDate}
                    onChange={(e) => handleInputChange('reviewDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalsText">Goals</Label>
                <Textarea
                  id="goalsText"
                  placeholder="Enter one goal per line, e.g.:&#10;Regain full range of motion&#10;Walk independently within 6 weeks&#10;Manage pain effectively"
                  value={formData.goalsText}
                  onChange={(e) => handleInputChange('goalsText', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one goal per line. Each line will be added as a separate goal.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  placeholder="Staff name or ID"
                  value={formData.assignedTo}
                  onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes (optional)"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                />
              </div>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Care Plan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5" />
            Care Plans
          </CardTitle>
          <CardDescription>
            {carePlans.length} care plan{carePlans.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto self-end">
              <Button variant="outline" size="icon" onClick={fetchCarePlans} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={fetchCarePlans}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {carePlans.length === 0
                ? 'No care plans created yet. Create your first care plan to get started.'
                : 'No care plans match your current filters.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Plan Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.patientName || plan.patientId}
                      {plan.patientChiNumber && (
                        <span className="block text-xs text-muted-foreground">
                          CHI: {plan.patientChiNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{plan.title}</div>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {plan.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{getCategoryBadge(plan.category)}</TableCell>
                    <TableCell>{getStatusBadge(plan.status)}</TableCell>
                    <TableCell>{formatDate(plan.startDate)}</TableCell>
                    <TableCell>{formatDate(plan.reviewDate)}</TableCell>
                    <TableCell>{plan.assignedToName || plan.assignedTo || '--'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
