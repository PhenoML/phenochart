export interface MockPatient {
  demographics: {
    name: string;
    age: number;
    sex: 'M' | 'F' | 'O';
    birthDate: string;
  };
  conditions: Array<{
    name: string;
    code: string;
    system: string;
    onsetDate: string;
    status: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    status: string;
  }>;
  allergies: Array<{
    substance: string;
    reaction: string;
    severity: string;
  }>;
  recentLabs: Array<{
    name: string;
    value: string;
    unit: string;
    date: string;
    status: 'normal' | 'abnormal' | 'critical';
  }>;
  recentVitals: Array<{
    name: string;
    value: string;
    unit: string;
    date: string;
  }>;
  procedures: Array<{
    name: string;
    date: string;
    status: string;
  }>;
  immunizations: Array<{
    name: string;
    date: string;
    status: string;
  }>;
  pastEncounters: Array<{
    date: string;
    type: string;
    summary: string;
  }>;
}

export const mockPatient: MockPatient = {
  demographics: {
    name: 'Steve Patient',
    age: 40,
    sex: 'M',
    birthDate: '1985-08-12',
  },
  conditions: [
    {
      name: 'Mild intermittent asthma',
      code: 'J45.20',
      system: 'ICD-10-CM',
      onsetDate: '2018-03-15',
      status: 'active',
    },
    {
      name: 'Orthostatic hypotension',
      code: 'I95.1',
      system: 'ICD-10-CM',
      onsetDate: '2024-11-20',
      status: 'active',
    },
    {
      name: 'Overweight (BMI 25-29.9)',
      code: 'E66.3',
      system: 'ICD-10-CM',
      onsetDate: '2023-06-01',
      status: 'active',
    },
    {
      name: 'History of influenza',
      code: 'Z86.19',
      system: 'ICD-10-CM',
      onsetDate: '2024-01-10',
      status: 'resolved',
    },
  ],
  medications: [
    {
      name: 'Albuterol sulfate HFA 90mcg/actuation inhaler',
      dosage: '2 puffs',
      frequency: 'every 4-6 hours as needed for wheezing',
      status: 'active',
    },
    {
      name: 'Fludrocortisone acetate 0.1mg tablet',
      dosage: '1 tablet',
      frequency: 'daily',
      status: 'active',
    },
  ],
  allergies: [
    {
      substance: 'Amoxicillin',
      reaction: 'Hives and itching',
      severity: 'moderate',
    },
  ],
  recentLabs: [
    {
      name: 'CBC - WBC',
      value: '11.2',
      unit: 'x10^3/uL',
      date: '2026-02-15',
      status: 'abnormal',
    },
    {
      name: 'CBC - Hemoglobin',
      value: '14.8',
      unit: 'g/dL',
      date: '2026-02-15',
      status: 'normal',
    },
    {
      name: 'Basic Metabolic Panel - Sodium',
      value: '139',
      unit: 'mEq/L',
      date: '2026-02-15',
      status: 'normal',
    },
    {
      name: 'Basic Metabolic Panel - Potassium',
      value: '3.4',
      unit: 'mEq/L',
      date: '2026-02-15',
      status: 'abnormal',
    },
    {
      name: 'Rapid Strep A',
      value: 'Negative',
      unit: '',
      date: '2026-02-15',
      status: 'normal',
    },
  ],
  recentVitals: [
    {
      name: 'Blood Pressure',
      value: '128/82',
      unit: 'mmHg',
      date: '2026-02-15',
    },
    {
      name: 'Heart Rate',
      value: '76',
      unit: 'bpm',
      date: '2026-02-15',
    },
    {
      name: 'Temperature',
      value: '101.2',
      unit: '°F',
      date: '2026-02-15',
    },
    {
      name: 'Weight',
      value: '185',
      unit: 'lbs',
      date: '2026-02-15',
    },
    {
      name: 'BMI',
      value: '25.3',
      unit: 'kg/m²',
      date: '2026-02-15',
    },
  ],
  procedures: [
    {
      name: 'Tilt table test',
      date: '2024-11-20',
      status: 'completed',
    },
  ],
  immunizations: [
    {
      name: 'Influenza vaccine',
      date: '2025-08-20',
      status: 'completed',
    },
  ],
  pastEncounters: [
    {
      date: '2026-02-15',
      type: 'Office Visit Level 3',
      summary:
        'Presented with malaise, fever (101.2°F), and two episodes of near-syncope over 3 days. CBC with differential ordered, rapid strep negative. Cardiology referral placed for syncope evaluation. Continue albuterol PRN and fludrocortisone daily.',
    },
    {
      date: '2025-08-20',
      type: 'Annual Physical',
      summary:
        'Routine annual exam. BMI 25.3 (overweight). Asthma well-controlled with PRN albuterol. Fludrocortisone continued for orthostatic symptoms. Labs: CBC, BMP, lipid panel — all within normal limits. Influenza vaccine administered.',
    },
    {
      date: '2024-11-20',
      type: 'Office Visit Level 2',
      summary:
        'Follow-up for recurrent lightheadedness on standing. Tilt table test positive for orthostatic hypotension. Started fludrocortisone acetate 0.1mg daily. Advised increased fluid and salt intake.',
    },
    {
      date: '2024-01-10',
      type: 'Urgent Care Visit',
      summary:
        'Influenza A positive. High fever (103°F), myalgias, cough. Prescribed oseltamivir (Tamiflu) 75mg BID x 5 days. Advised rest and hydration. Resolved without complications.',
    },
  ],
};

export function buildPatientContextMessage(patient: MockPatient): string {
  const lines: string[] = [];

  lines.push(`## Patient: ${patient.demographics.name}`);
  lines.push(
    `${patient.demographics.age}yo ${patient.demographics.sex === 'M' ? 'male' : patient.demographics.sex === 'F' ? 'female' : 'patient'}, DOB: ${patient.demographics.birthDate}`,
  );
  lines.push('');

  const activeConditions = patient.conditions.filter((c) => c.status === 'active');
  if (activeConditions.length > 0) {
    lines.push('### Active Conditions');
    for (const c of activeConditions) {
      lines.push(`- ${c.name} (${c.code}) — onset ${c.onsetDate}`);
    }
    lines.push('');
  }

  const activeMeds = patient.medications.filter((m) => m.status === 'active');
  if (activeMeds.length > 0) {
    lines.push('### Medications');
    for (const m of activeMeds) {
      lines.push(`- ${m.name} — ${m.dosage} ${m.frequency}`);
    }
    lines.push('');
  }

  if (patient.allergies.length > 0) {
    lines.push('### Allergies');
    for (const a of patient.allergies) {
      lines.push(`- ${a.substance}: ${a.reaction} (${a.severity})`);
    }
    lines.push('');
  }

  if (patient.recentLabs.length > 0) {
    lines.push('### Recent Labs');
    for (const l of patient.recentLabs) {
      const flag = l.status !== 'normal' ? ` [${l.status.toUpperCase()}]` : '';
      lines.push(`- ${l.name}: ${l.value} ${l.unit}${flag} (${l.date})`);
    }
    lines.push('');
  }

  if (patient.recentVitals.length > 0) {
    lines.push('### Recent Vitals');
    for (const v of patient.recentVitals) {
      lines.push(`- ${v.name}: ${v.value} ${v.unit} (${v.date})`);
    }
    lines.push('');
  }

  if (patient.procedures.length > 0) {
    lines.push('### Procedures');
    for (const p of patient.procedures) {
      lines.push(`- ${p.date} — ${p.name} (${p.status})`);
    }
    lines.push('');
  }

  if (patient.immunizations.length > 0) {
    lines.push('### Immunizations');
    for (const i of patient.immunizations) {
      lines.push(`- ${i.date} — ${i.name} (${i.status})`);
    }
    lines.push('');
  }

  if (patient.pastEncounters.length > 0) {
    lines.push('### Past Encounters');
    for (const e of patient.pastEncounters) {
      lines.push(`- ${e.date} — ${e.type}: ${e.summary}`);
    }
  }

  return lines.join('\n');
}
