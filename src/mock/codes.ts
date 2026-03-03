import type { ExtractedCode } from '../types';

export const mockCodes: ExtractedCode[] = [
  {
    id: 'code-r50.8',
    code: 'R50.8',
    system: 'ICD-10-CM',
    description: 'Other specified fever',
    reason:
      'Patient presents with intermittent fevers up to 101.2\u00B0F with temperature of 100.8\u00B0F on examination.',
    valid: true,
    citations: [
      {
        text: 'Patient is a 40-year-old male presenting to the office with complaints of malaise, fever, and episodes of syncope over the past three days.',
        begin_offset: 0,
        end_offset: 139,
      },
    ],
  },
  {
    id: 'code-r55',
    code: 'R55',
    system: 'ICD-10-CM',
    description: 'Syncope and collapse',
    reason:
      'Patient reports two episodes of near-syncope \u2014 one while standing from a seated position and another while walking upstairs.',
    valid: true,
    citations: [
      {
        text: 'He reports feeling generally unwell with intermittent fevers up to 101.2\u00B0F and two episodes of near-syncope, one while standing from a seated position and another while walking upstairs.',
        begin_offset: 140,
        end_offset: 326,
      },
    ],
  },
  {
    id: 'code-j45.2',
    code: 'J45.2',
    system: 'ICD-10-CM',
    description: 'Mild intermittent asthma',
    reason:
      'Past medical history is significant for mild intermittent asthma, managed with albuterol inhaler as needed.',
    valid: true,
    citations: [
      {
        text: 'Past medical history is significant for mild intermittent asthma, managed with albuterol sulfate HFA 90mcg inhaler as needed.',
        begin_offset: 419,
        end_offset: 544,
      },
    ],
  },
  {
    id: 'code-i95.1',
    code: 'I95.1',
    system: 'ICD-10-CM',
    description: 'Orthostatic hypotension',
    reason:
      'Differential includes orthostatic hypotension potentially related to dehydration from fever. Near-syncope occurred while standing from a seated position.',
    valid: true,
    citations: [
      {
        text: 'Differential includes viral syndrome, early bacterial infection, and orthostatic hypotension potentially related to dehydration from fever.',
        begin_offset: 1405,
        end_offset: 1544,
      },
    ],
  },
  {
    id: 'code-e66.3',
    code: 'E66.3',
    system: 'ICD-10-CM',
    description: 'Overweight',
    reason:
      'BMI is 25.3 kg/m2, which falls in the overweight range (25.0-29.9).',
    valid: true,
    citations: [
      {
        text: 'BMI is 25.3 kg/m2 (overweight range).',
        begin_offset: 665,
        end_offset: 702,
      },
    ],
  },
  {
    id: 'code-745752',
    code: '745752',
    system: 'RXNORM',
    description: 'ProAir HFA 90 MCG/INHAL Metered Dose Inhaler, 200 Actuations',
    reason:
      'Patient takes albuterol sulfate HFA 90mcg inhaler, 2 puffs every 4-6 hours as needed for wheezing.',
    valid: true,
    citations: [
      {
        text: '1. Albuterol sulfate HFA 90mcg/actuation inhaler \u2014 2 puffs every 4-6 hours as needed for wheezing',
        begin_offset: 797,
        end_offset: 894,
      },
    ],
  },
  {
    id: 'code-313979',
    code: '313979',
    system: 'RXNORM',
    description: 'fludrocortisone acetate 0.1 MG Oral Tablet',
    reason:
      'Patient takes fludrocortisone acetate 0.1mg, 1 tablet daily.',
    valid: true,
    citations: [
      {
        text: '2. Fludrocortisone acetate 0.1mg tablet \u2014 1 tablet daily',
        begin_offset: 895,
        end_offset: 951,
      },
    ],
  },
];
