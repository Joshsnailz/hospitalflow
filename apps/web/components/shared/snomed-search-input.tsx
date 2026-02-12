'use client';

import { snomedApi } from '@/lib/api/snomed';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

type SnomedSearchType = 'allergens' | 'clinicalFindings' | 'drugs';

const SEARCH_FN: Record<SnomedSearchType, (term: string) => Promise<ComboboxOption[]>> = {
  allergens: snomedApi.searchAllergens,
  clinicalFindings: snomedApi.searchClinicalFindings,
  drugs: snomedApi.searchDrugs,
};

const PLACEHOLDERS: Record<SnomedSearchType, string> = {
  allergens: 'Search allergens...',
  clinicalFindings: 'Search conditions...',
  drugs: 'Search medications...',
};

interface SnomedSearchInputProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  searchType: SnomedSearchType;
  allowFreeText?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SnomedSearchInput({
  value,
  onValueChange,
  searchType,
  allowFreeText = true,
  placeholder,
  disabled,
  className,
}: SnomedSearchInputProps) {
  return (
    <Combobox
      value={value}
      onValueChange={onValueChange}
      onSearch={SEARCH_FN[searchType]}
      allowFreeText={allowFreeText}
      placeholder={placeholder || PLACEHOLDERS[searchType]}
      disabled={disabled}
      emptyMessage="No results. You can type a custom value."
      className={className}
    />
  );
}
