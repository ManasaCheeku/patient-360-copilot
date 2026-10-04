const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

const today = '2026-10-04'

export const demoPatients = [
  { patient_id: 'P-1001', name: 'Mara Voss', age: 58, gender: 'Female', location: 'Harbor District', risk_level: 'Elevated', conditions_count: 3 },
  { patient_id: 'P-1002', name: 'Theo Arden', age: 66, gender: 'Male', location: 'Northgate', risk_level: 'High', conditions_count: 4 },
  { patient_id: 'P-1003', name: 'Inez Calder', age: 44, gender: 'Female', location: 'Westhaven', risk_level: 'Moderate', conditions_count: 2 },
  { patient_id: 'P-1004', name: 'Jonas Reed', age: 52, gender: 'Male', location: 'Meadow Park', risk_level: 'Elevated', conditions_count: 3 },
  { patient_id: 'P-1005', name: 'Leona Park', age: 39, gender: 'Female', location: 'Cedar Point', risk_level: 'Low', conditions_count: 1 },
  { patient_id: 'P-1006', name: 'Oren Bell', age: 71, gender: 'Male', location: 'Riverview', risk_level: 'High', conditions_count: 5 },
  { patient_id: 'P-1007', name: 'Sana Mirek', age: 61, gender: 'Female', location: 'Eastfield', risk_level: 'Moderate', conditions_count: 2 },
  { patient_id: 'P-1008', name: 'Elias Rowan', age: 47, gender: 'Male', location: 'Lakeside', risk_level: 'Elevated', conditions_count: 3 },
  { patient_id: 'P-1009', name: 'Nora Vale', age: 55, gender: 'Female', location: 'Summit Ward', risk_level: 'Moderate', conditions_count: 2 },
  { patient_id: 'P-1010', name: 'Kian Solis', age: 63, gender: 'Male', location: 'Old Mill', risk_level: 'High', conditions_count: 4 },
]

const demoCitations = [
  {
    id: 'lab-ldl-2026-09-15',
    source: 'Lab Result',
    title: 'Lipid Panel — LDL Cholesterol',
    section: 'Result record',
    date: '2026-09-15',
    excerpt: 'LDL cholesterol 172 mg/dL, flagged high in this synthetic result record.',
    record_type: 'lab',
    record_id: 'LAB-3812',
  },
  {
    id: 'encounter-2026-08-10',
    source: 'Encounter Record',
    title: 'Primary Care Follow-up',
    section: 'Assessment',
    date: '2026-08-10',
    excerpt: 'Hypertension remains on the active problem list; home blood-pressure monitoring was discussed.',
    record_type: 'encounter',
    record_id: 'ENC-2208',
  },
  {
    id: 'med-safety-3',
    source: 'Medication Safety Bulletin',
    title: 'NSAID & antihypertensive monitoring bulletin',
    section: 'Section 3 — renal and blood-pressure monitoring',
    date: '2026-07-22',
    excerpt: 'Synthetic guidance: review renal function and blood pressure when NSAIDs are used with antihypertensive therapy.',
    record_type: 'document',
    record_id: 'DOC-MED-003',
    document_id: 'DOC-MED-003',
  },
  {
    id: 'note-family-history',
    source: 'Clinical Visit Note',
    title: 'Preventive-care review',
    section: 'History',
    date: '2026-08-10',
    excerpt: 'Synthetic record documents a family history of premature cardiovascular disease.',
    record_type: 'document',
    record_id: 'DOC-CLN-001',
    document_id: 'DOC-CLN-001',
  },
]

export const demoPatient = {
  patient_id: 'P-1001',
  name: 'Mara Voss',
  age: 58,
  gender: 'Female',
  location: 'Harbor District',
  date_of_birth: '1968-02-14',
  payer: 'Northstar Health Plan',
  member_id: 'SYN-8841',
  risk_level: 'Elevated',
  conditions: [
    { name: 'Hypertension', status: 'Active', since: '2024-03-18', icd_code: 'SYN-I10' },
    { name: 'Hyperlipidemia', status: 'Active', since: '2025-06-04', icd_code: 'SYN-E78.5' },
    { name: 'Osteoarthritis, knee', status: 'Active', since: '2023-11-09', icd_code: 'SYN-M17.1' },
  ],
  medications: [
    { name: 'Lisinopril', dose: '20 mg', frequency: 'Once daily', status: 'Active', start_date: '2025-01-12' },
    { name: 'Atorvastatin', dose: '20 mg', frequency: 'At bedtime', status: 'Active', start_date: '2025-06-04' },
    { name: 'Ibuprofen', dose: '200 mg', frequency: 'As needed', status: 'Active', start_date: '2026-07-18' },
  ],
  allergies: [
    { allergen: 'Penicillin class', reaction: 'Rash', severity: 'Moderate', status: 'Active' },
  ],
  lab_results: [
    { name: 'LDL Cholesterol', value: '172', unit: 'mg/dL', flag: 'High', date: '2026-09-15', reference_range: '< 130' },
    { name: 'eGFR', value: '68', unit: 'mL/min/1.73 m²', flag: 'Borderline', date: '2026-09-15', reference_range: '≥ 60' },
    { name: 'HbA1c', value: '5.7', unit: '%', flag: 'Borderline', date: '2026-09-15', reference_range: '< 5.7' },
    { name: 'Systolic BP', value: '148', unit: 'mmHg', flag: 'High', date: '2026-08-10', reference_range: '< 130' },
  ],
  encounters: [
    { date: '2026-08-10', type: 'Primary care', reason: 'Chronic condition follow-up', disposition: 'Completed' },
    { date: '2026-05-18', type: 'Orthopedics', reason: 'Knee pain evaluation', disposition: 'Completed' },
    { date: '2026-01-12', type: 'Primary care', reason: 'Medication review', disposition: 'Completed' },
  ],
  claims: [
    { date: '2026-08-10', service: 'Office visit', category: 'Outpatient', status: 'Paid', amount: '$146' },
    { date: '2026-05-18', service: 'Specialist evaluation', category: 'Outpatient', status: 'Paid', amount: '$238' },
    { date: '2026-02-02', service: 'Lipid panel', category: 'Laboratory', status: 'Paid', amount: '$72' },
  ],
}

export const demoTimeline = [
  { id: 'evt-1', date: '2026-09-15', type: 'lab', title: 'Lipid panel resulted', detail: 'LDL cholesterol is 172 mg/dL and flagged high.', citation_id: 'lab-ldl-2026-09-15' },
  { id: 'evt-2', date: '2026-08-10', type: 'encounter', title: 'Primary care follow-up', detail: 'Hypertension and preventive cardiovascular risk factors reviewed.', citation_id: 'encounter-2026-08-10' },
  { id: 'evt-3', date: '2026-07-22', type: 'document', title: 'Safety guidance matched', detail: 'Medication safety bulletin is relevant to PRN NSAID use.', citation_id: 'med-safety-3' },
  { id: 'evt-4', date: '2026-05-18', type: 'encounter', title: 'Orthopedic evaluation', detail: 'Knee osteoarthritis follow-up completed.', citation_id: null },
  { id: 'evt-5', date: '2025-06-04', type: 'medication', title: 'Atorvastatin initiated', detail: 'Therapy listed as active in synthetic medication record.', citation_id: null },
]

export const demoRisks = [
  {
    id: 'risk-cv',
    title: 'Elevated cardiovascular risk',
    severity: 'Elevated',
    summary: 'Rule-based flag from active hypertension, high LDL, and a documented synthetic family-history signal.',
    factors: [
      { factor: 'Hypertension', evidence: 'Active diagnosis and 148 mmHg systolic result', severity: 'High', citation_id: 'encounter-2026-08-10' },
      { factor: 'LDL cholesterol 172 mg/dL', evidence: 'High synthetic lipid-panel result', severity: 'High', citation_id: 'lab-ldl-2026-09-15' },
      { factor: 'Family history signal', evidence: 'Documented in synthetic clinical note', severity: 'Moderate', citation_id: 'note-family-history' },
    ],
  },
  {
    id: 'risk-medication',
    title: 'Medication monitoring consideration',
    severity: 'Moderate',
    summary: 'Rule-based review prompt for occasional NSAID use alongside antihypertensive therapy and borderline renal function.',
    factors: [
      { factor: 'PRN NSAID plus antihypertensive therapy', evidence: 'Synthetic medication list and safety bulletin', severity: 'Moderate', citation_id: 'med-safety-3' },
      { factor: 'eGFR 68 mL/min/1.73 m²', evidence: 'Borderline synthetic laboratory result', severity: 'Moderate', citation_id: 'lab-ldl-2026-09-15' },
    ],
  },
]

export const demoDocuments = [
  {
    document_id: 'DOC-CLN-001',
    title: 'Preventive-care review',
    document_type: 'Clinical visit note',
    date: '2026-08-10',
    source: 'Synthetic clinical record',
    sections: [
      { heading: 'Assessment', text: 'Hypertension and hyperlipidemia are active synthetic conditions. Blood-pressure monitoring and lipid management were discussed.' },
      { heading: 'History', text: 'Synthetic record documents a family history of premature cardiovascular disease.' },
    ],
  },
  {
    document_id: 'DOC-MED-003',
    title: 'NSAID & antihypertensive monitoring bulletin',
    document_type: 'Medication safety bulletin',
    date: '2026-07-22',
    source: 'Synthetic medication-safety library',
    sections: [
      { heading: 'Section 3 — renal and blood-pressure monitoring', text: 'Synthetic guidance: review renal function and blood pressure when NSAIDs are used with antihypertensive therapy.' },
      { heading: 'Scope', text: 'This educational synthetic document supports evidence retrieval in the demo and is not clinical guidance.' },
    ],
  },
  {
    document_id: 'DOC-GDL-002',
    title: 'Lipid management evidence summary',
    document_type: 'Clinical guideline excerpt',
    date: '2026-04-18',
    source: 'Synthetic evidence library',
    sections: [
      { heading: 'Risk-factor review', text: 'Synthetic evidence summary describes reviewing blood pressure, lipid values, and relevant history together rather than in isolation.' },
    ],
  },
  {
    document_id: 'DOC-REG-004',
    title: 'Pharmacovigilance documentation framework',
    document_type: 'Regulatory reference',
    date: '2026-03-05',
    source: 'Synthetic regulatory library',
    sections: [
      { heading: 'Evidence traceability', text: 'Synthetic reference emphasizes linking a safety consideration to the source record and relevant section.' },
    ],
  },
]

export function flattenPayload(payload, key) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.[key])) return payload[key]
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export function normalisePatient(payload) {
  const source = payload?.patient || payload?.data || payload || {}
  const records = (items) => (Array.isArray(items) ? items : [])
  return {
    ...source,
    patient_id: source.patient_id ?? source.id ?? source.member_id ?? 'unknown',
    name: source.name ?? [source.first_name, source.last_name].filter(Boolean).join(' ') ?? 'Synthetic patient',
    age: source.age ?? source.demographics?.age,
    gender: source.gender ?? source.sex ?? source.demographics?.gender,
    location: source.location ?? source.city ?? source.demographics?.location,
    conditions: records(source.conditions ?? source.diagnoses).map((item) => ({
      ...item,
      since: item.since ?? item.diagnosed_on,
      icd_code: item.icd_code ?? item.code,
    })),
    medications: records(source.medications ?? source.medication_list).map((item) => ({
      ...item,
      start_date: item.start_date ?? item.started_on,
    })),
    allergies: records(source.allergies).map((item) => ({
      ...item,
      allergen: item.allergen ?? item.substance,
    })),
    lab_results: records(source.lab_results ?? source.labs ?? source.labResults).map((item) => ({
      ...item,
      name: item.name ?? item.test_name,
      date: item.date ?? item.collected_on ?? item.result_date,
    })),
    encounters: records(source.encounters).map((item) => ({
      ...item,
      date: item.date ?? item.encounter_date,
      type: item.type ?? item.encounter_type,
      reason: item.reason ?? item.summary,
    })),
    claims: records(source.claims ?? source.utilization).map((item) => ({
      ...item,
      date: item.date ?? item.service_date,
      service: item.service ?? item.description ?? item.category,
    })),
  }
}

function normaliseDocument(document) {
  const sections = document.sections ?? document.chunks ?? []
  return {
    ...document,
    source: document.source ?? document.source_type,
    document_type: document.document_type ?? document.source_type ?? document.type,
    sections: sections.map((section) => ({
      ...section,
      heading: section.heading ?? section.section,
      text: section.text ?? section.excerpt,
    })),
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    const error = new Error(`API request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return response.json()
}

export async function getPatients() {
  const payload = await request('/patients')
  return flattenPayload(payload, 'patients').map(normalisePatient)
}

export async function getPatient(patientId) {
  return normalisePatient(await request(`/patients/${encodeURIComponent(patientId)}`))
}

export async function getTimeline(patientId) {
  const payload = await request(`/patients/${encodeURIComponent(patientId)}/timeline`)
  return flattenPayload(payload, 'timeline')
}

export async function getRisks(patientId) {
  const payload = await request(`/patients/${encodeURIComponent(patientId)}/risks`)
  return flattenPayload(payload, 'risks')
}

export async function getDocuments(patientId) {
  const payload = await request(`/patients/${encodeURIComponent(patientId)}/documents`)
  return flattenPayload(payload, 'documents').map(normaliseDocument)
}

export async function queryCopilot(patientId, question) {
  return request('/copilot/query', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId, question }),
  })
}

export function getDemoCitation(citationId) {
  return demoCitations.find((citation) => citation.id === citationId)
}

function citationFor(id) {
  return demoCitations.find((citation) => citation.id === id)
}

export function buildDemoResponse(question, patient = demoPatient) {
  const lower = question.toLowerCase()
  let answer = ''
  let facts = []
  let citations = []

  if (/(safety|medication|drug|interaction|nsaid)/.test(lower)) {
    answer = `Retrieved facts: ${patient.name} has active synthetic records for lisinopril, atorvastatin, and as-needed ibuprofen. A medication-safety bulletin in the synthetic evidence library is relevant to NSAID use with antihypertensive therapy.\n\nInference: the rule-based prototype flags this as a monitoring consideration because the patient also has a borderline eGFR result. This is not a diagnosis or treatment recommendation.`
    facts = ['Active medications include lisinopril, atorvastatin, and PRN ibuprofen.', 'A synthetic safety bulletin describes renal and blood-pressure monitoring for NSAID use with antihypertensive therapy.']
    citations = [citationFor('med-safety-3'), citationFor('lab-ldl-2026-09-15')]
  } else if (/(risk|elevated|evidence)/.test(lower)) {
    answer = `Retrieved facts: the selected synthetic record lists active hypertension and hyperlipidemia. The latest lipid panel includes LDL cholesterol of 172 mg/dL, flagged high. A synthetic clinical note documents a family-history signal.\n\nInference: the transparent prototype rule combines these signals into an elevated cardiovascular-risk flag. It is evidence-based prototype logic, not a medical diagnosis.`
    facts = ['Hypertension is active in the synthetic encounter record.', 'LDL cholesterol is 172 mg/dL in the synthetic lipid panel.', 'A family-history signal appears in the synthetic clinical note.']
    citations = [citationFor('encounter-2026-08-10'), citationFor('lab-ldl-2026-09-15'), citationFor('note-family-history')]
  } else if (/(history|summarize|recent|timeline)/.test(lower)) {
    answer = `Retrieved facts: in the latest synthetic records, a lipid panel on 2026-09-15 returned high LDL cholesterol; a primary-care follow-up on 2026-08-10 reviewed hypertension; and a medication-safety bulletin was matched to the active medication list.\n\nInference: the current dashboard prioritizes cardiovascular risk review and medication monitoring as the most relevant next evidence areas.`
    facts = ['Lipid panel dated 2026-09-15 includes a high LDL result.', 'Primary-care follow-up dated 2026-08-10 reviewed hypertension.', 'Medication-safety bulletin matched to the synthetic medication list.']
    citations = [citationFor('lab-ldl-2026-09-15'), citationFor('encounter-2026-08-10'), citationFor('med-safety-3')]
  } else {
    answer = `Retrieved facts: ${patient.name}'s synthetic profile has ${patient.conditions.length} active conditions, ${patient.medications.length} active medications, and ${patient.lab_results.length} recent lab records. The available evidence includes structured records and synthetic local documents.\n\nI can help summarize clinical history, explain rule-based risk signals, review medication safety evidence, or surface relevant clinical and regulatory sources. I will only use the retrieved synthetic records shown in this demo.`
    facts = ['Structured synthetic patient profile loaded.', 'Synthetic document evidence is available for retrieval.']
    citations = [citationFor('encounter-2026-08-10'), citationFor('med-safety-3')]
  }

  return {
    answer,
    retrieved_facts: facts,
    citations: citations.filter(Boolean),
    mode: 'deterministic_fallback',
    generated_at: today,
  }
}

export { API_BASE_URL, demoCitations }
