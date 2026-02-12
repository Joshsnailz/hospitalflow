import type { ComboboxOption } from '@/components/ui/combobox';

export const POLICY_HOLDER_RELATIONSHIPS: ComboboxOption[] = [
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'legal_guardian', label: 'Legal Guardian' },
  { value: 'domestic_partner', label: 'Domestic Partner' },
  { value: 'other', label: 'Other' },
];
