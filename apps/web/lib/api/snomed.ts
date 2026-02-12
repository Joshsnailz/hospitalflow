import type { ComboboxOption } from '@/components/ui/combobox';

const SNOMED_BASE_URL = 'https://browser.ihtsdotools.org/snowstorm/snomed-ct';
const SNOMED_BRANCH = 'MAIN/SNOMEDCT-UK-CL';
const TIMEOUT_MS = 5000;

interface SnomedConcept {
  conceptId: string;
  fsn: { term: string };
  pt: { term: string };
}

interface SnomedSearchResponse {
  items: SnomedConcept[];
}

async function searchSnomed(
  term: string,
  ecl: string,
  limit: number = 15
): Promise<ComboboxOption[]> {
  if (!term || term.length < 2) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      term,
      ecl,
      limit: String(limit),
      active: 'true',
      offset: '0',
    });

    const response = await fetch(
      `${SNOMED_BASE_URL}/browser/${encodeURIComponent(SNOMED_BRANCH)}/descriptions?${params}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) return [];

    const data: SnomedSearchResponse = await response.json();

    // Deduplicate by conceptId
    const seen = new Set<string>();
    return data.items
      .filter((item) => {
        if (seen.has(item.conceptId)) return false;
        seen.add(item.conceptId);
        return true;
      })
      .map((item) => ({
        value: item.pt.term,
        label: item.pt.term,
        description: `SNOMED: ${item.conceptId}`,
      }));
  } catch {
    // Graceful fallback - return empty so free text can be used
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export const snomedApi = {
  /** Search for allergen substances and pharmaceutical products */
  searchAllergens: (term: string): Promise<ComboboxOption[]> =>
    searchSnomed(term, '< 105590001 OR < 373873005'),

  /** Search for clinical findings (conditions, diagnoses) */
  searchClinicalFindings: (term: string): Promise<ComboboxOption[]> =>
    searchSnomed(term, '< 404684003'),

  /** Search for pharmaceutical/biological products (drugs) */
  searchDrugs: (term: string): Promise<ComboboxOption[]> =>
    searchSnomed(term, '< 373873005'),
};
