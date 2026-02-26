import type { Encounter } from '../types';

export const mockNarrative = `Patient is a 40-year-old male presenting to the office with complaints of malaise, fever, and episodes of syncope over the past three days. He reports feeling generally unwell with intermittent fevers up to 101.2\u00B0F and two episodes of near-syncope, one while standing from a seated position and another while walking upstairs. He denies chest pain, palpitations, shortness of breath at rest, or loss of consciousness.

Past medical history is significant for mild intermittent asthma, managed with albuterol sulfate HFA 90mcg inhaler as needed. He also takes fludrocortisone acetate 0.1mg daily. He reports a prior episode of influenza approximately two years ago. BMI is 25.3 kg/m2 (overweight range).

Allergies: Amoxicillin \u2014 causes hives and itching (moderate severity).

Current medications:
1. Albuterol sulfate HFA 90mcg/actuation inhaler \u2014 2 puffs every 4-6 hours as needed for wheezing
2. Fludrocortisone acetate 0.1mg tablet \u2014 1 tablet daily

Physical examination reveals a mildly ill-appearing male. Temperature 100.8\u00B0F, blood pressure 118/76, heart rate 92, respiratory rate 16, SpO2 98% on room air. HEENT: Oropharynx mildly erythematous, no exudates. Lungs: Clear to auscultation bilaterally, no wheezes or crackles. Cardiovascular: Regular rate and rhythm, no murmurs. Abdomen: Soft, non-tender.

Assessment: Patient presents with acute febrile illness with associated malaise and syncope. Differential includes viral syndrome, early bacterial infection, and orthostatic hypotension potentially related to dehydration from fever. Given the syncopal episodes, cardiology consultation is warranted to rule out arrhythmia or structural heart disease.

Plan:
1. CBC with manual differential to evaluate for infection
2. Rapid strep A test to rule out streptococcal pharyngitis
3. Continue albuterol as needed for any respiratory symptoms
4. Continue fludrocortisone daily
5. Cardiology referral for evaluation of syncope
6. Follow-up in 7 days or sooner if symptoms worsen
7. Patient advised to maintain adequate hydration and monitor temperature`;

export const mockEncounter: Encounter = {
  id: 'enc-steve-001',
  patient: {
    name: 'Steve Patient',
    age: 40,
    sex: 'M',
  },
  date: '2026-02-15',
  type: 'Office Visit Level 3',
  narrative: mockNarrative,
  existingCodes: [],
  problemListCodes: {},
};
