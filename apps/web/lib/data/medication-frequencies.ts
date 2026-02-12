import type { ComboboxOption } from '@/components/ui/combobox';

export const MEDICATION_FREQUENCIES: ComboboxOption[] = [
  { value: 'OD', label: 'OD - Once daily' },
  { value: 'BD', label: 'BD - Twice daily' },
  { value: 'TDS', label: 'TDS - Three times daily' },
  { value: 'QDS', label: 'QDS - Four times daily' },
  { value: 'PRN', label: 'PRN - As required' },
  { value: 'Nocte', label: 'Nocte - At night' },
  { value: 'Mane', label: 'Mane - In the morning' },
  { value: 'STAT', label: 'STAT - Immediately' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Fortnightly', label: 'Fortnightly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Q4H', label: 'Every 4 hours' },
  { value: 'Q6H', label: 'Every 6 hours' },
  { value: 'Q8H', label: 'Every 8 hours' },
  { value: 'Q12H', label: 'Every 12 hours' },
];
