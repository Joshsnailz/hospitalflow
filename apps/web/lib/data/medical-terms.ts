/**
 * SNOMED CT-inspired medical terminology lists.
 * Covers common allergens and medications relevant to the Zimbabwean clinical context.
 */

export interface MedicalTerm {
  value: string;
  label: string;
  category: string;
  snomedCode?: string;
}

// ---------------------------------------------------------------------------
// ALLERGENS
// ---------------------------------------------------------------------------

export const ALLERGENS: MedicalTerm[] = [
  // Drug allergens
  { value: 'Penicillin', label: 'Penicillin', category: 'Drug', snomedCode: '372687004' },
  { value: 'Amoxicillin', label: 'Amoxicillin', category: 'Drug', snomedCode: '372687004' },
  { value: 'Ampicillin', label: 'Ampicillin', category: 'Drug', snomedCode: '372687004' },
  { value: 'Cloxacillin', label: 'Cloxacillin', category: 'Drug' },
  { value: 'Co-amoxiclav', label: 'Co-amoxiclav (Augmentin)', category: 'Drug' },
  { value: 'Cephalosporins', label: 'Cephalosporins', category: 'Drug', snomedCode: '372840004' },
  { value: 'Ceftriaxone', label: 'Ceftriaxone', category: 'Drug' },
  { value: 'Sulfonamides', label: 'Sulfonamides (Sulfa drugs)', category: 'Drug', snomedCode: '387406002' },
  { value: 'Co-trimoxazole', label: 'Co-trimoxazole (Septrin)', category: 'Drug' },
  { value: 'Tetracycline', label: 'Tetracycline', category: 'Drug', snomedCode: '372809001' },
  { value: 'Doxycycline', label: 'Doxycycline', category: 'Drug' },
  { value: 'Erythromycin', label: 'Erythromycin', category: 'Drug', snomedCode: '372694001' },
  { value: 'Ciprofloxacin', label: 'Ciprofloxacin', category: 'Drug', snomedCode: '372840004' },
  { value: 'Metronidazole', label: 'Metronidazole', category: 'Drug', snomedCode: '372795001' },
  { value: 'Aspirin', label: 'Aspirin (Acetylsalicylic acid)', category: 'Drug', snomedCode: '387458008' },
  { value: 'Ibuprofen', label: 'Ibuprofen', category: 'Drug', snomedCode: '387207008' },
  { value: 'Diclofenac', label: 'Diclofenac', category: 'Drug', snomedCode: '7034005' },
  { value: 'Paracetamol', label: 'Paracetamol (Acetaminophen)', category: 'Drug', snomedCode: '387517004' },
  { value: 'Morphine', label: 'Morphine', category: 'Drug', snomedCode: '373529000' },
  { value: 'Codeine', label: 'Codeine', category: 'Drug', snomedCode: '387494007' },
  { value: 'Tramadol', label: 'Tramadol', category: 'Drug' },
  { value: 'Chloroquine', label: 'Chloroquine', category: 'Drug' },
  { value: 'Quinine', label: 'Quinine', category: 'Drug' },
  { value: 'Artemether-lumefantrine', label: 'Artemether-lumefantrine (Coartem)', category: 'Drug' },
  { value: 'Fluconazole', label: 'Fluconazole', category: 'Drug' },
  { value: 'Iodine', label: 'Iodine / Iodine contrast media', category: 'Drug', snomedCode: '44588005' },
  { value: 'Latex', label: 'Latex (rubber)', category: 'Drug', snomedCode: '1003750002' },

  // Food allergens
  { value: 'Peanuts', label: 'Peanuts (groundnuts)', category: 'Food', snomedCode: '91935009' },
  { value: 'Tree nuts', label: 'Tree nuts', category: 'Food', snomedCode: '762952008' },
  { value: 'Shellfish', label: 'Shellfish', category: 'Food', snomedCode: '412071004' },
  { value: 'Fish', label: 'Fish', category: 'Food', snomedCode: '417716004' },
  { value: "Cow's milk", label: "Cow's milk / Dairy", category: 'Food', snomedCode: '425525006' },
  { value: 'Eggs', label: 'Eggs', category: 'Food', snomedCode: '91930004' },
  { value: 'Wheat / Gluten', label: 'Wheat / Gluten', category: 'Food', snomedCode: '420174000' },
  { value: 'Soy', label: 'Soy / Soya', category: 'Food', snomedCode: '714035009' },
  { value: 'Sesame', label: 'Sesame', category: 'Food' },
  { value: 'Maize (corn)', label: 'Maize (corn)', category: 'Food' },
  { value: 'Banana', label: 'Banana', category: 'Food' },

  // Environmental allergens
  { value: 'Dust mites', label: 'Dust mites', category: 'Environmental', snomedCode: '260152009' },
  { value: 'Grass pollen', label: 'Grass pollen', category: 'Environmental', snomedCode: '418689008' },
  { value: 'Tree pollen', label: 'Tree pollen', category: 'Environmental' },
  { value: 'Mould / Fungi', label: 'Mould / Fungi', category: 'Environmental' },
  { value: 'Cat dander', label: 'Cat dander', category: 'Environmental', snomedCode: '232348006' },
  { value: 'Dog hair', label: 'Dog hair', category: 'Environmental' },
  { value: 'Cockroach', label: 'Cockroach', category: 'Environmental' },
  { value: 'Bee venom', label: 'Bee venom', category: 'Environmental', snomedCode: '288328004' },
  { value: 'Wasp venom', label: 'Wasp venom', category: 'Environmental', snomedCode: '288323003' },
  { value: 'Mosquito bite', label: 'Mosquito bite', category: 'Environmental' },
  { value: 'Nickel', label: 'Nickel', category: 'Environmental', snomedCode: '6532009' },
  { value: 'Adhesive tape / plaster', label: 'Adhesive tape / plaster', category: 'Environmental' },
  { value: 'Chlorhexidine', label: 'Chlorhexidine', category: 'Environmental' },
];

// ---------------------------------------------------------------------------
// MEDICATIONS
// ---------------------------------------------------------------------------

export const MEDICATIONS: MedicalTerm[] = [
  // Antibiotics
  { value: 'Amoxicillin 250mg', label: 'Amoxicillin 250mg', category: 'Antibiotics' },
  { value: 'Amoxicillin 500mg', label: 'Amoxicillin 500mg', category: 'Antibiotics' },
  { value: 'Ampicillin 250mg', label: 'Ampicillin 250mg', category: 'Antibiotics' },
  { value: 'Benzylpenicillin', label: 'Benzylpenicillin (Penicillin G)', category: 'Antibiotics' },
  { value: 'Penicillin VK 250mg', label: 'Penicillin VK 250mg', category: 'Antibiotics' },
  { value: 'Cloxacillin 250mg', label: 'Cloxacillin 250mg', category: 'Antibiotics' },
  { value: 'Flucloxacillin 250mg', label: 'Flucloxacillin 250mg', category: 'Antibiotics' },
  { value: 'Co-amoxiclav 375mg', label: 'Co-amoxiclav 375mg', category: 'Antibiotics' },
  { value: 'Co-amoxiclav 625mg', label: 'Co-amoxiclav 625mg', category: 'Antibiotics' },
  { value: 'Doxycycline 100mg', label: 'Doxycycline 100mg', category: 'Antibiotics' },
  { value: 'Tetracycline 250mg', label: 'Tetracycline 250mg', category: 'Antibiotics' },
  { value: 'Erythromycin 250mg', label: 'Erythromycin 250mg', category: 'Antibiotics' },
  { value: 'Azithromycin 250mg', label: 'Azithromycin 250mg', category: 'Antibiotics' },
  { value: 'Azithromycin 500mg', label: 'Azithromycin 500mg', category: 'Antibiotics' },
  { value: 'Ciprofloxacin 250mg', label: 'Ciprofloxacin 250mg', category: 'Antibiotics' },
  { value: 'Ciprofloxacin 500mg', label: 'Ciprofloxacin 500mg', category: 'Antibiotics' },
  { value: 'Metronidazole 200mg', label: 'Metronidazole 200mg', category: 'Antibiotics' },
  { value: 'Metronidazole 400mg', label: 'Metronidazole 400mg', category: 'Antibiotics' },
  { value: 'Co-trimoxazole 480mg', label: 'Co-trimoxazole 480mg (Septrin)', category: 'Antibiotics' },
  { value: 'Co-trimoxazole 960mg', label: 'Co-trimoxazole 960mg (Septrin Forte)', category: 'Antibiotics' },
  { value: 'Gentamicin 80mg', label: 'Gentamicin 80mg/2ml injection', category: 'Antibiotics' },
  { value: 'Ceftriaxone 1g', label: 'Ceftriaxone 1g injection', category: 'Antibiotics' },
  { value: 'Ceftriaxone 250mg', label: 'Ceftriaxone 250mg injection', category: 'Antibiotics' },
  { value: 'Chloramphenicol 250mg', label: 'Chloramphenicol 250mg', category: 'Antibiotics' },
  { value: 'Clindamycin 150mg', label: 'Clindamycin 150mg', category: 'Antibiotics' },
  { value: 'Fluconazole 150mg', label: 'Fluconazole 150mg', category: 'Antibiotics' },
  { value: 'Fluconazole 200mg', label: 'Fluconazole 200mg', category: 'Antibiotics' },
  { value: 'Nystatin oral drops', label: 'Nystatin oral drops', category: 'Antibiotics' },

  // Analgesics / Pain relief
  { value: 'Paracetamol 500mg', label: 'Paracetamol 500mg', category: 'Analgesics' },
  { value: 'Paracetamol 1g', label: 'Paracetamol 1g', category: 'Analgesics' },
  { value: 'Paracetamol syrup 120mg/5ml', label: 'Paracetamol syrup 120mg/5ml', category: 'Analgesics' },
  { value: 'Ibuprofen 200mg', label: 'Ibuprofen 200mg', category: 'Analgesics' },
  { value: 'Ibuprofen 400mg', label: 'Ibuprofen 400mg', category: 'Analgesics' },
  { value: 'Ibuprofen 600mg', label: 'Ibuprofen 600mg', category: 'Analgesics' },
  { value: 'Aspirin 75mg', label: 'Aspirin 75mg', category: 'Analgesics' },
  { value: 'Aspirin 300mg', label: 'Aspirin 300mg', category: 'Analgesics' },
  { value: 'Diclofenac 25mg', label: 'Diclofenac 25mg', category: 'Analgesics' },
  { value: 'Diclofenac 50mg', label: 'Diclofenac 50mg', category: 'Analgesics' },
  { value: 'Tramadol 50mg', label: 'Tramadol 50mg', category: 'Analgesics' },
  { value: 'Tramadol 100mg', label: 'Tramadol 100mg', category: 'Analgesics' },
  { value: 'Morphine 10mg', label: 'Morphine 10mg/ml injection', category: 'Analgesics' },
  { value: 'Codeine 30mg', label: 'Codeine phosphate 30mg', category: 'Analgesics' },
  { value: 'Pethidine 50mg', label: 'Pethidine 50mg injection', category: 'Analgesics' },

  // Antihypertensives / Cardiovascular
  { value: 'Atenolol 50mg', label: 'Atenolol 50mg', category: 'Antihypertensives' },
  { value: 'Atenolol 100mg', label: 'Atenolol 100mg', category: 'Antihypertensives' },
  { value: 'Amlodipine 5mg', label: 'Amlodipine 5mg', category: 'Antihypertensives' },
  { value: 'Amlodipine 10mg', label: 'Amlodipine 10mg', category: 'Antihypertensives' },
  { value: 'Enalapril 5mg', label: 'Enalapril 5mg', category: 'Antihypertensives' },
  { value: 'Enalapril 10mg', label: 'Enalapril 10mg', category: 'Antihypertensives' },
  { value: 'Lisinopril 5mg', label: 'Lisinopril 5mg', category: 'Antihypertensives' },
  { value: 'Lisinopril 10mg', label: 'Lisinopril 10mg', category: 'Antihypertensives' },
  { value: 'Hydrochlorothiazide 12.5mg', label: 'Hydrochlorothiazide 12.5mg', category: 'Antihypertensives' },
  { value: 'Hydrochlorothiazide 25mg', label: 'Hydrochlorothiazide 25mg', category: 'Antihypertensives' },
  { value: 'Nifedipine 10mg', label: 'Nifedipine 10mg', category: 'Antihypertensives' },
  { value: 'Nifedipine 20mg', label: 'Nifedipine 20mg SR', category: 'Antihypertensives' },
  { value: 'Methyldopa 250mg', label: 'Methyldopa 250mg', category: 'Antihypertensives' },
  { value: 'Furosemide 40mg', label: 'Furosemide 40mg', category: 'Antihypertensives' },
  { value: 'Spironolactone 25mg', label: 'Spironolactone 25mg', category: 'Antihypertensives' },
  { value: 'Digoxin 0.25mg', label: 'Digoxin 0.25mg', category: 'Antihypertensives' },

  // Antidiabetics
  { value: 'Metformin 500mg', label: 'Metformin 500mg', category: 'Antidiabetics' },
  { value: 'Metformin 850mg', label: 'Metformin 850mg', category: 'Antidiabetics' },
  { value: 'Metformin 1g', label: 'Metformin 1g', category: 'Antidiabetics' },
  { value: 'Glibenclamide 2.5mg', label: 'Glibenclamide 2.5mg', category: 'Antidiabetics' },
  { value: 'Glibenclamide 5mg', label: 'Glibenclamide 5mg', category: 'Antidiabetics' },
  { value: 'Insulin Actrapid', label: 'Insulin Actrapid (regular)', category: 'Antidiabetics' },
  { value: 'Insulin Mixtard 30', label: 'Insulin Mixtard 30/70', category: 'Antidiabetics' },
  { value: 'Insulin Protaphane', label: 'Insulin Protaphane (NPH)', category: 'Antidiabetics' },
  { value: 'Insulin glargine', label: 'Insulin glargine (Lantus)', category: 'Antidiabetics' },

  // Antiretrovirals (ARVs)
  { value: 'TDF/3TC/EFV', label: 'TDF/3TC/EFV (Tenofovir/Lamivudine/Efavirenz)', category: 'Antiretrovirals' },
  { value: 'TDF/3TC/DTG', label: 'TDF/3TC/DTG (Tenofovir/Lamivudine/Dolutegravir)', category: 'Antiretrovirals' },
  { value: 'Tenofovir 300mg', label: 'Tenofovir disoproxil 300mg', category: 'Antiretrovirals' },
  { value: 'Lamivudine 150mg', label: 'Lamivudine 150mg', category: 'Antiretrovirals' },
  { value: 'Efavirenz 600mg', label: 'Efavirenz 600mg', category: 'Antiretrovirals' },
  { value: 'Dolutegravir 50mg', label: 'Dolutegravir 50mg', category: 'Antiretrovirals' },
  { value: 'Zidovudine 300mg', label: 'Zidovudine (AZT) 300mg', category: 'Antiretrovirals' },
  { value: 'Nevirapine 200mg', label: 'Nevirapine 200mg', category: 'Antiretrovirals' },
  { value: 'Lopinavir/ritonavir', label: 'Lopinavir/ritonavir (Aluvia)', category: 'Antiretrovirals' },

  // Antimalarials
  { value: 'Artemether-lumefantrine', label: 'Artemether-lumefantrine (Coartem)', category: 'Antimalarials' },
  { value: 'Artesunate 50mg', label: 'Artesunate 50mg', category: 'Antimalarials' },
  { value: 'Quinine 300mg', label: 'Quinine 300mg', category: 'Antimalarials' },
  { value: 'Quinine IV', label: 'Quinine IV infusion', category: 'Antimalarials' },
  { value: 'Chloroquine 150mg', label: 'Chloroquine 150mg', category: 'Antimalarials' },
  { value: 'Sulfadoxine-pyrimethamine', label: 'Sulfadoxine-pyrimethamine (Fansidar)', category: 'Antimalarials' },

  // Respiratory
  { value: 'Salbutamol inhaler', label: 'Salbutamol inhaler 100mcg', category: 'Respiratory' },
  { value: 'Salbutamol nebule', label: 'Salbutamol 2.5mg nebule', category: 'Respiratory' },
  { value: 'Beclomethasone inhaler', label: 'Beclomethasone inhaler 100mcg', category: 'Respiratory' },
  { value: 'Prednisolone 5mg', label: 'Prednisolone 5mg', category: 'Respiratory' },
  { value: 'Prednisolone 25mg', label: 'Prednisolone 25mg', category: 'Respiratory' },
  { value: 'Hydrocortisone 100mg', label: 'Hydrocortisone 100mg injection', category: 'Respiratory' },

  // Gastrointestinal
  { value: 'Omeprazole 20mg', label: 'Omeprazole 20mg', category: 'Gastrointestinal' },
  { value: 'Omeprazole 40mg', label: 'Omeprazole 40mg', category: 'Gastrointestinal' },
  { value: 'Ranitidine 150mg', label: 'Ranitidine 150mg', category: 'Gastrointestinal' },
  { value: 'Antacid (Alu-Mag)', label: 'Antacid (Aluminium-Magnesium)', category: 'Gastrointestinal' },
  { value: 'Metoclopramide 10mg', label: 'Metoclopramide 10mg', category: 'Gastrointestinal' },
  { value: 'ORS sachets', label: 'Oral Rehydration Salts (ORS)', category: 'Gastrointestinal' },
  { value: 'Zinc 20mg', label: 'Zinc sulphate 20mg', category: 'Gastrointestinal' },

  // Supplements / Haematinics
  { value: 'Ferrous sulphate 200mg', label: 'Ferrous sulphate 200mg', category: 'Supplements' },
  { value: 'Folic acid 5mg', label: 'Folic acid 5mg', category: 'Supplements' },
  { value: 'Folic acid 400mcg', label: 'Folic acid 400mcg', category: 'Supplements' },
  { value: 'Vitamin B12 injection', label: 'Vitamin B12 (hydroxocobalamin) injection', category: 'Supplements' },
  { value: 'Vitamin C 200mg', label: 'Vitamin C 200mg', category: 'Supplements' },
  { value: 'Multivitamins', label: 'Multivitamins', category: 'Supplements' },

  // Anticoagulants / Haematology
  { value: 'Warfarin 1mg', label: 'Warfarin 1mg', category: 'Anticoagulants' },
  { value: 'Warfarin 5mg', label: 'Warfarin 5mg', category: 'Anticoagulants' },
  { value: 'Heparin 5000IU', label: 'Heparin 5000IU/ml injection', category: 'Anticoagulants' },
  { value: 'Enoxaparin 40mg', label: 'Enoxaparin 40mg injection', category: 'Anticoagulants' },
];
