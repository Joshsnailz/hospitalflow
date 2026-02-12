'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { patientsApi } from '@/lib/api/patients';
import type { Patient, CreatePatientDto, Gender, MaritalStatus } from '@/lib/types/patient';
import { Loader2, CheckCircle, AlertCircle, User, Phone, MapPin, Stethoscope } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { NATIONALITIES } from '@/lib/data/nationalities';
import { ETHNICITIES } from '@/lib/data/ethnicities';
import { LANGUAGES } from '@/lib/data/languages';
import { COUNTRIES } from '@/lib/data/countries';

interface PatientFormProps {
  patient?: Patient;
  mode: 'create' | 'edit';
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

const maritalStatusOptions: { value: MaritalStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
  { value: 'unknown', label: 'Unknown' },
];

export function PatientForm({ patient, mode }: PatientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [chiValidation, setChiValidation] = useState<{
    isValid: boolean;
    errors: string[];
    exists?: boolean;
  } | null>(null);
  const [isValidatingChi, setIsValidatingChi] = useState(false);

  const [formData, setFormData] = useState<CreatePatientDto>({
    chiNumber: patient?.chiNumber || '',
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    middleName: patient?.middleName || '',
    dateOfBirth: patient?.dateOfBirth?.split('T')[0] || '',
    gender: patient?.gender || 'unknown',
    maritalStatus: patient?.maritalStatus || 'unknown',
    nationality: patient?.nationality || '',
    ethnicity: patient?.ethnicity || '',
    preferredLanguage: patient?.preferredLanguage || 'English',
    email: patient?.email || '',
    phonePrimary: patient?.phonePrimary || '',
    phoneSecondary: patient?.phoneSecondary || '',
    addressLine1: patient?.addressLine1 || '',
    addressLine2: patient?.addressLine2 || '',
    city: patient?.city || '',
    county: patient?.county || '',
    postCode: patient?.postCode || '',
    country: patient?.country || 'United Kingdom',
    gpName: patient?.gpName || '',
    gpPracticeName: patient?.gpPracticeName || '',
    gpPracticeAddress: patient?.gpPracticeAddress || '',
    gpPhone: patient?.gpPhone || '',
    gpEmail: patient?.gpEmail || '',
    notes: patient?.notes || '',
  });

  const handleChange = (field: keyof CreatePatientDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const validateChiNumber = async (chi: string) => {
    if (!chi || chi.length < 11) {
      setChiValidation(null);
      return;
    }

    setIsValidatingChi(true);
    try {
      const response = await patientsApi.validateChi(chi);
      setChiValidation(response.data);
    } catch {
      setChiValidation({ isValid: false, errors: ['Failed to validate CHI number'] });
    } finally {
      setIsValidatingChi(false);
    }
  };

  useEffect(() => {
    if (mode === 'create') {
      const timeoutId = setTimeout(() => {
        validateChiNumber(formData.chiNumber);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.chiNumber, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'create') {
        const response = await patientsApi.create(formData);
        setSuccess('Patient created successfully!');
        setTimeout(() => {
          router.push(`/patients/${response.data.id}`);
        }, 1500);
      } else if (patient) {
        const { chiNumber, ...updateData } = formData;
        await patientsApi.update(patient.id, updateData);
        setSuccess('Patient updated successfully!');
        setTimeout(() => {
          router.push(`/patients/${patient.id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* CHI Number & Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="chiNumber">CHI Number *</Label>
            <div className="relative">
              <Input
                id="chiNumber"
                value={formData.chiNumber}
                onChange={(e) => handleChange('chiNumber', e.target.value.toUpperCase())}
                placeholder="70282487G70"
                maxLength={11}
                disabled={mode === 'edit'}
                className={mode === 'edit' ? 'bg-muted' : ''}
              />
              {isValidatingChi && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {chiValidation && mode === 'create' && (
              <p className={`text-sm ${chiValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {chiValidation.isValid
                  ? chiValidation.exists
                    ? 'CHI number already exists'
                    : 'Valid CHI number'
                  : chiValidation.errors[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="John"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleChange('middleName', e.target.value)}
              placeholder="William"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleChange('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(value) => handleChange('maritalStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {maritalStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Combobox
              value={formData.nationality}
              onValueChange={(value) => handleChange('nationality', value)}
              options={NATIONALITIES}
              allowFreeText
              placeholder="Select nationality"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ethnicity">Ethnicity</Label>
            <Combobox
              value={formData.ethnicity}
              onValueChange={(value) => handleChange('ethnicity', value)}
              options={ETHNICITIES}
              allowFreeText
              placeholder="Select ethnicity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred Language</Label>
            <Combobox
              value={formData.preferredLanguage}
              onValueChange={(value) => handleChange('preferredLanguage', value)}
              options={LANGUAGES}
              allowFreeText
              placeholder="Select language"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john.doe@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phonePrimary">Primary Phone</Label>
            <Input
              id="phonePrimary"
              value={formData.phonePrimary}
              onChange={(e) => handleChange('phonePrimary', e.target.value)}
              placeholder="+441234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneSecondary">Secondary Phone</Label>
            <Input
              id="phoneSecondary"
              value={formData.phoneSecondary}
              onChange={(e) => handleChange('phoneSecondary', e.target.value)}
              placeholder="+441234567891"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => handleChange('addressLine1', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => handleChange('addressLine2', e.target.value)}
              placeholder="Apt 4B"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="London"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Input
              id="county"
              value={formData.county}
              onChange={(e) => handleChange('county', e.target.value)}
              placeholder="Greater London"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postCode">Post Code</Label>
            <Input
              id="postCode"
              value={formData.postCode}
              onChange={(e) => handleChange('postCode', e.target.value.toUpperCase())}
              placeholder="SW1A 1AA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Combobox
              value={formData.country}
              onValueChange={(value) => handleChange('country', value)}
              options={COUNTRIES}
              allowFreeText
              placeholder="Select country"
            />
          </div>
        </CardContent>
      </Card>

      {/* GP Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            GP Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="gpName">GP Name</Label>
            <Input
              id="gpName"
              value={formData.gpName}
              onChange={(e) => handleChange('gpName', e.target.value)}
              placeholder="Dr. Jane Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpPracticeName">Practice Name</Label>
            <Input
              id="gpPracticeName"
              value={formData.gpPracticeName}
              onChange={(e) => handleChange('gpPracticeName', e.target.value)}
              placeholder="City Medical Centre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpPhone">GP Phone</Label>
            <Input
              id="gpPhone"
              value={formData.gpPhone}
              onChange={(e) => handleChange('gpPhone', e.target.value)}
              placeholder="+441234567892"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpEmail">GP Email</Label>
            <Input
              id="gpEmail"
              type="email"
              value={formData.gpEmail}
              onChange={(e) => handleChange('gpEmail', e.target.value)}
              placeholder="reception@citymedical.nhs.uk"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="gpPracticeAddress">Practice Address</Label>
            <Textarea
              id="gpPracticeAddress"
              value={formData.gpPracticeAddress}
              onChange={(e) => handleChange('gpPracticeAddress', e.target.value)}
              placeholder="456 Health Street, London, SW1A 2BB"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional notes about the patient..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isLoading ||
            (mode === 'create' && (!chiValidation?.isValid || chiValidation?.exists))
          }
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Patient' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
