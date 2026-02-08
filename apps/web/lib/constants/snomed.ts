/**
 * SNOMED CT Common Terms
 *
 * In production, this would connect to a SNOMED CT API
 * For now, using common terms for autocomplete
 */

export interface SnomedConcept {
  id: string;
  term: string;
  category: string;
}

// Common Allergies (SNOMED CT concepts)
export const COMMON_ALLERGIES: SnomedConcept[] = [
  // Drug allergies
  { id: '91936005', term: 'Penicillin allergy', category: 'Drug Allergy' },
  { id: '294505008', term: 'Aspirin allergy', category: 'Drug Allergy' },
  { id: '293586001', term: 'Sulfonamide allergy', category: 'Drug Allergy' },
  { id: '91937001', term: 'Latex allergy', category: 'Drug Allergy' },
  { id: '419511003', term: 'Iodine allergy', category: 'Drug Allergy' },
  { id: '294506009', term: 'Codeine allergy', category: 'Drug Allergy' },
  { id: '416098002', term: 'Morphine allergy', category: 'Drug Allergy' },
  { id: '387458008', term: 'Amoxicillin allergy', category: 'Drug Allergy' },
  { id: '294510007', term: 'Cephalosporin allergy', category: 'Drug Allergy' },
  { id: '419511003', term: 'Propofol allergy', category: 'Drug Allergy' },

  // Food allergies
  { id: '227493005', term: 'Peanut allergy', category: 'Food Allergy' },
  { id: '300913006', term: 'Shellfish allergy', category: 'Food Allergy' },
  { id: '213020009', term: 'Egg allergy', category: 'Food Allergy' },
  { id: '425525006', term: 'Milk allergy', category: 'Food Allergy' },
  { id: '419263009', term: 'Tree nut allergy', category: 'Food Allergy' },
  { id: '417532002', term: 'Wheat allergy', category: 'Food Allergy' },
  { id: '414285001', term: 'Soy allergy', category: 'Food Allergy' },
  { id: '419199007', term: 'Fish allergy', category: 'Food Allergy' },
  { id: '714035009', term: 'Sesame seed allergy', category: 'Food Allergy' },

  // Environmental allergies
  { id: '232347008', term: 'Pollen allergy', category: 'Environmental' },
  { id: '232350006', term: 'Dust mite allergy', category: 'Environmental' },
  { id: '232346004', term: 'Cat allergy', category: 'Environmental' },
  { id: '232344001', term: 'Dog allergy', category: 'Environmental' },
  { id: '419474003', term: 'Mold allergy', category: 'Environmental' },
  { id: '424213003', term: 'Bee sting allergy', category: 'Environmental' },
  { id: '293584003', term: 'Insect bite allergy', category: 'Environmental' },
];

// Common Medications (SNOMED CT concepts)
export const COMMON_MEDICATIONS: SnomedConcept[] = [
  // Cardiovascular
  { id: '319844004', term: 'Lisinopril', category: 'Cardiovascular' },
  { id: '319847006', term: 'Amlodipine', category: 'Cardiovascular' },
  { id: '318037005', term: 'Metoprolol', category: 'Cardiovascular' },
  { id: '318047001', term: 'Atorvastatin', category: 'Cardiovascular' },
  { id: '387517004', term: 'Warfarin', category: 'Cardiovascular' },
  { id: '372448005', term: 'Aspirin', category: 'Cardiovascular' },
  { id: '372733002', term: 'Clopidogrel', category: 'Cardiovascular' },
  { id: '372912004', term: 'Furosemide', category: 'Cardiovascular' },

  // Diabetes
  { id: '325072002', term: 'Metformin', category: 'Diabetes' },
  { id: '411529005', term: 'Insulin glargine', category: 'Diabetes' },
  { id: '411530000', term: 'Insulin lispro', category: 'Diabetes' },
  { id: '325064001', term: 'Glimepiride', category: 'Diabetes' },
  { id: '418985005', term: 'Sitagliptin', category: 'Diabetes' },

  // Pain/Anti-inflammatory
  { id: '387207008', term: 'Ibuprofen', category: 'Pain Relief' },
  { id: '387517004', term: 'Paracetamol', category: 'Pain Relief' },
  { id: '429707008', term: 'Diclofenac', category: 'Pain Relief' },
  { id: '372806008', term: 'Tramadol', category: 'Pain Relief' },
  { id: '373529000', term: 'Morphine', category: 'Pain Relief' },
  { id: '387494007', term: 'Codeine', category: 'Pain Relief' },

  // Antibiotics
  { id: '372687004', term: 'Amoxicillin', category: 'Antibiotic' },
  { id: '372652001', term: 'Ciprofloxacin', category: 'Antibiotic' },
  { id: '372856008', term: 'Azithromycin', category: 'Antibiotic' },
  { id: '372760008', term: 'Doxycycline', category: 'Antibiotic' },
  { id: '372840008', term: 'Ceftriaxone', category: 'Antibiotic' },
  { id: '372643008', term: 'Metronidazole', category: 'Antibiotic' },

  // Respiratory
  { id: '318073001', term: 'Salbutamol', category: 'Respiratory' },
  { id: '319499005', term: 'Budesonide', category: 'Respiratory' },
  { id: '319853006', term: 'Montelukast', category: 'Respiratory' },
  { id: '372531000', term: 'Cetirizine', category: 'Respiratory' },
  { id: '396458002', term: 'Loratadine', category: 'Respiratory' },

  // Gastrointestinal
  { id: '387137007', term: 'Omeprazole', category: 'Gastrointestinal' },
  { id: '396047003', term: 'Lansoprazole', category: 'Gastrointestinal' },
  { id: '387559005', term: 'Ranitidine', category: 'Gastrointestinal' },
  { id: '387046007', term: 'Loperamide', category: 'Gastrointestinal' },

  // Mental Health
  { id: '372586001', term: 'Sertraline', category: 'Mental Health' },
  { id: '372602008', term: 'Fluoxetine', category: 'Mental Health' },
  { id: '372840002', term: 'Citalopram', category: 'Mental Health' },
  { id: '386858008', term: 'Diazepam', category: 'Mental Health' },
  { id: '387562000', term: 'Lorazepam', category: 'Mental Health' },
  { id: '387506008', term: 'Amitriptyline', category: 'Mental Health' },

  // Other common
  { id: '326289003', term: 'Levothyroxine', category: 'Thyroid' },
  { id: '385469007', term: 'Vitamin D', category: 'Supplement' },
  { id: '419382002', term: 'Folic acid', category: 'Supplement' },
  { id: '409137002', term: 'Calcium supplement', category: 'Supplement' },
];

/**
 * Search SNOMED concepts by term
 */
export function searchSnomedConcepts(
  query: string,
  concepts: SnomedConcept[],
  limit: number = 10
): SnomedConcept[] {
  if (!query || query.trim() === '') {
    return concepts.slice(0, limit);
  }

  const searchTerm = query.toLowerCase();

  return concepts
    .filter(concept =>
      concept.term.toLowerCase().includes(searchTerm) ||
      concept.category.toLowerCase().includes(searchTerm)
    )
    .sort((a, b) => {
      // Prioritize matches at the start of the term
      const aStarts = a.term.toLowerCase().startsWith(searchTerm);
      const bStarts = b.term.toLowerCase().startsWith(searchTerm);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.term.localeCompare(b.term);
    })
    .slice(0, limit);
}
