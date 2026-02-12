import type { ComboboxOption } from '@/components/ui/combobox';

export const MEDICATION_ROUTES: ComboboxOption[] = [
  { value: 'oral', label: 'Oral' },
  { value: 'iv', label: 'Intravenous (IV)' },
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'sc', label: 'Subcutaneous (SC)' },
  { value: 'topical', label: 'Topical' },
  { value: 'inhaled', label: 'Inhaled' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'buccal', label: 'Buccal' },
  { value: 'rectal', label: 'Rectal' },
  { value: 'vaginal', label: 'Vaginal' },
  { value: 'ophthalmic', label: 'Ophthalmic' },
  { value: 'otic', label: 'Otic' },
  { value: 'nasal', label: 'Nasal' },
  { value: 'transdermal', label: 'Transdermal' },
  { value: 'epidural', label: 'Epidural' },
  { value: 'intrathecal', label: 'Intrathecal' },
  { value: 'nebulised', label: 'Nebulised' },
];
