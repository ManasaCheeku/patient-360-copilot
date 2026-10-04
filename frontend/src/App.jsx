import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Bot,
  BrainCircuit,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  FlaskConical,
  HeartPulse,
  Info,
  LayoutDashboard,
  LoaderCircle,
  MapPin,
  Menu,
  MessageSquareText,
  PanelRight,
  Pill,
  Plus,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UsersRound,
  X,
} from 'lucide-react'
import {
  API_BASE_URL,
  buildDemoResponse,
  demoCitations,
  demoDocuments,
  demoPatient,
  demoPatients,
  demoRisks,
  demoTimeline,
  getDocuments,
  getPatients,
  getRisks,
  getTimeline,
  getPatient,
  queryCopilot,
} from './lib/api'

const navigation = [
  { id: 'patient', label: 'Patient 360', icon: LayoutDashboard, caption: 'Profile & clinical history' },
  { id: 'copilot', label: 'Evidence Copilot', icon: Bot, caption: 'Ask grounded questions' },
  { id: 'documents', label: 'Documents / Evidence', icon: FileText, caption: 'Inspect source material' },
  { id: 'risks', label: 'Risk & Insights', icon: BrainCircuit, caption: 'Transparent rule logic' },
]

const prompts = [
  'What are the major risk factors for this patient?',
  'Are there any medication safety concerns?',
  'Summarize the patient’s recent clinical history.',
  'What clinical or regulatory evidence is relevant?',
]

const asArray = (value) => (Array.isArray(value) ? value : [])
const coalesce = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')

function itemTitle(item, keys = ['name', 'title', 'label', 'condition', 'allergen', 'service', 'statement']) {
  if (typeof item === 'string') return item
  return coalesce(...keys.map((key) => item?.[key]), 'Not recorded')
}

function safeDate(value, fallback = '—') {
  if (!value) return fallback
  const date = new Date(`${value}`.slice(0, 10))
  if (Number.isNaN(date.valueOf())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatAmount(value) {
  if (typeof value === 'number') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  return value
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'SP'
}

function severityTone(value) {
  const normal = `${value || ''}`.toLowerCase()
  if (normal.includes('high') || normal.includes('critical') || normal.includes('elevated')) return 'danger'
  if (normal.includes('moderate') || normal.includes('borderline') || normal.includes('watch')) return 'warning'
  if (normal.includes('low') || normal.includes('normal') || normal.includes('stable')) return 'success'
  return 'neutral'
}

function fallbackProfile(id) {
  const listItem = demoPatients.find((entry) => entry.patient_id === id)
  return { ...demoPatient, ...(listItem || {}), patient_id: id || demoPatient.patient_id }
}

function normaliseCitations(payload) {
  return asArray(payload?.citations ?? payload?.sources ?? payload?.evidence).map((citation, index) => ({
    id: coalesce(citation.id, citation.citation_id, citation.record_id, `citation-${index}`),
    source: coalesce(citation.source, citation.source_name, citation.record_type, 'Evidence record'),
    title: coalesce(citation.title, citation.name, citation.source, 'Synthetic evidence'),
    section: coalesce(citation.section, citation.section_name, citation.reference, 'Record detail'),
    date: coalesce(citation.date, citation.record_date),
    excerpt: coalesce(citation.excerpt, citation.text, citation.content, citation.snippet, 'No excerpt supplied by the API.'),
    document_id: citation.document_id,
    record_type: citation.record_type,
    record_id: citation.record_id,
    ...citation,
  }))
}

function PageLoader() {
  return (
    <div className="page-loader" aria-label="Loading patient records">
      <LoaderCircle size={24} className="spin" />
      <span>Loading synthetic patient records…</span>
    </div>
  )
}

function SeverityPill({ value, className = '' }) {
  return <span className={`pill pill-${severityTone(value)} ${className}`}>{value || 'Not assessed'}</span>
}

function SyntheticTag({ compact = false }) {
  return (
    <span className={`synthetic-tag ${compact ? 'synthetic-tag-compact' : ''}`}>
      <ShieldCheck size={compact ? 12 : 14} />
      {compact ? 'Synthetic' : 'Synthetic data'}
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'blue' }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span className="metric-icon"><Icon size={19} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  )
}

function SectionHeader({ icon: Icon, eyebrow, title, action, children }) {
  return (
    <div className="section-heading">
      <div className="section-heading-main">
        {Icon && <span className="section-icon"><Icon size={18} /></span>}
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {children}
        </div>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ icon: Icon = ClipboardList, title, description }) {
  return (
    <div className="empty-state">
      <span><Icon size={24} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function Sidebar({ activePage, onNavigate, patient, menuOpen, onCloseMenu }) {
  return (
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-block">
        <div className="brand-mark"><HeartPulse size={22} strokeWidth={2.6} /></div>
        <div>
          <strong>Patient<span>360</span></strong>
          <p>Clinical Evidence Copilot</p>
        </div>
        <button className="icon-button sidebar-close" onClick={onCloseMenu} aria-label="Close navigation"><X size={18} /></button>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        <p className="nav-label">Workspace</p>
        {navigation.map(({ id, label, icon: Icon, caption }) => (
          <button
            key={id}
            className={`nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => { onNavigate(id); onCloseMenu() }}
          >
            <Icon size={19} />
            <span><strong>{label}</strong><small>{caption}</small></span>
            {activePage === id && <ChevronRight size={16} className="nav-arrow" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-patient">
        <p className="nav-label">Active record</p>
        <div className="mini-patient">
          <span className="avatar avatar-small">{initials(patient?.name)}</span>
          <div>
            <strong>{patient?.name || 'Loading…'}</strong>
            <small>{patient?.patient_id || 'Synthetic profile'}</small>
          </div>
          <span className={`risk-dot ${severityTone(patient?.risk_level)}`} />
        </div>
      </div>

      <div className="sidebar-footnote">
        <SyntheticTag compact />
        <p>Evidence-linked prototype<br />Not clinical decision support</p>
      </div>
    </aside>
  )
}

function Header({ patients, patient, activePage, onPatientChange, onMenuClick, apiMode, onReload }) {
  const [query, setQuery] = useState('')
  const [patientMenuOpen, setPatientMenuOpen] = useState(false)
  const filteredPatients = patients.filter((entry) => `${entry.name} ${entry.patient_id}`.toLowerCase().includes(query.toLowerCase()))
  const currentPage = navigation.find((entry) => entry.id === activePage)

  return (
    <>
      <header className="topbar">
        <div className="mobile-topbar-brand">
          <button className="icon-button" onClick={onMenuClick} aria-label="Open navigation"><Menu size={20} /></button>
          <span className="mobile-brand-mark"><HeartPulse size={18} /></span>
        </div>
        <div className="breadcrumb">
          <span>Workspace</span><ChevronRight size={14} /><strong>{currentPage?.label}</strong>
        </div>
        <div className="topbar-actions">
          <button className={`api-state ${apiMode === 'live' ? 'api-live' : 'api-demo'}`} onClick={onReload} title={`API base: ${API_BASE_URL}`}>
            <span />{apiMode === 'live' ? 'Live API' : 'Demo data'}
          </button>
          <div className="patient-picker-wrap">
            <button className="patient-picker" onClick={() => setPatientMenuOpen(!patientMenuOpen)} aria-expanded={patientMenuOpen}>
              <span className="avatar">{initials(patient?.name)}</span>
              <span className="patient-picker-copy"><small>Viewing patient</small><strong>{patient?.name || 'Select profile'}</strong></span>
              <ChevronDown size={17} />
            </button>
            {patientMenuOpen && (
              <div className="patient-menu">
                <div className="patient-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Search synthetic patients" /></div>
                <div className="patient-menu-list">
                  {filteredPatients.map((entry) => (
                    <button key={entry.patient_id} className={entry.patient_id === patient?.patient_id ? 'selected' : ''} onClick={() => { onPatientChange(entry.patient_id); setPatientMenuOpen(false); setQuery('') }}>
                      <span className="avatar avatar-small">{initials(entry.name)}</span>
                      <span><strong>{entry.name}</strong><small>{entry.patient_id} · {entry.age}y · {entry.gender}</small></span>
                      <SeverityPill value={entry.risk_level} />
                    </button>
                  ))}
                  {!filteredPatients.length && <p className="no-results">No synthetic patient found</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="demo-banner"><ShieldCheck size={15} /><span><strong>Demo environment</strong> — synthetic/de-identified data only. This prototype is not medical advice or a clinical diagnosis.</span></div>
    </>
  )
}

function PatientHero({ patient, risks, onNavigate }) {
  const primaryRisk = risks?.[0]
  return (
    <section className="patient-hero">
      <div className="hero-identity">
        <span className="avatar avatar-hero">{initials(patient.name)}</span>
        <div>
          <div className="patient-name-line"><h1>{patient.name}</h1><SyntheticTag compact /></div>
          <p className="patient-meta"><span>{patient.age || '—'} years</span><i /> <span>{patient.gender || 'Not recorded'}</span><i /> <span><MapPin size={14} />{patient.location || 'Location not recorded'}</span></p>
          <div className="patient-identifiers"><span>Patient ID <strong>{patient.patient_id}</strong></span>{patient.member_id && <span>Member ID <strong>{patient.member_id}</strong></span>}{patient.payer && <span><Building2 size={13} />{patient.payer}</span>}</div>
        </div>
      </div>
      <div className="hero-risk-panel">
        <span className="risk-panel-label">Rule-based risk summary</span>
        <SeverityPill value={patient.risk_level || primaryRisk?.severity || 'Not assessed'} />
        <p>{primaryRisk?.title || 'Risk signals are assessed from available synthetic records.'}</p>
        <button className="link-button" onClick={() => onNavigate('risks')}>Review rationale <ArrowUpRight size={15} /></button>
      </div>
    </section>
  )
}

function PatientPage({ patient, timeline, risks, documents, onNavigate, onEvidence }) {
  const conditions = asArray(patient.conditions)
  const medications = asArray(patient.medications)
  const labs = asArray(patient.lab_results)
  const allergies = asArray(patient.allergies)
  const encounters = asArray(patient.encounters)
  const claims = asArray(patient.claims)
  const highLabs = labs.filter((lab) => ['high', 'borderline', 'abnormal'].some((word) => `${lab.flag || lab.status || ''}`.toLowerCase().includes(word))).length

  return (
    <>
      <PatientHero patient={patient} risks={risks} onNavigate={onNavigate} />
      <div className="metric-grid">
        <MetricCard icon={Stethoscope} label="Active conditions" value={conditions.length} detail="Current problem list" tone="blue" />
        <MetricCard icon={Pill} label="Active medications" value={medications.length} detail="Medication reconciliation" tone="violet" />
        <MetricCard icon={FlaskConical} label="Lab signals" value={highLabs} detail={`${labs.length} recent results`} tone="amber" />
        <MetricCard icon={FileText} label="Evidence sources" value={documents.length} detail="Synthetic local documents" tone="teal" />
      </div>

      <div className="dashboard-grid dashboard-top-grid">
        <section className="surface-card clinical-summary-card">
          <SectionHeader icon={ClipboardList} eyebrow="Structured profile" title="Clinical snapshot" action={<button className="link-button" onClick={() => onNavigate('copilot')}>Ask Copilot <ArrowUpRight size={15} /></button>} />
          <div className="summary-columns">
            <div>
              <p className="subsection-label">Conditions</p>
              <div className="condition-list">
                {conditions.slice(0, 4).map((item, index) => <div className="list-row" key={`${itemTitle(item)}-${index}`}><span className="condition-dot" /><div><strong>{itemTitle(item)}</strong><small>{coalesce(item.status, item.since && `Since ${safeDate(item.since)}`, item.icd_code, 'Active record')}</small></div><SeverityPill value={item.status || 'Active'} /></div>)}
                {!conditions.length && <EmptyState title="No conditions supplied" description="The API returned no condition records." />}
              </div>
            </div>
            <div>
              <p className="subsection-label">Medication list</p>
              <div className="med-list">
                {medications.slice(0, 4).map((item, index) => <div className="list-row" key={`${itemTitle(item)}-${index}`}><span className="med-icon"><Pill size={14} /></span><div><strong>{itemTitle(item)}</strong><small>{[item.dose, item.frequency].filter(Boolean).join(' · ') || item.status || 'Active record'}</small></div><ChevronRight size={16} /></div>)}
                {!medications.length && <EmptyState icon={Pill} title="No medications supplied" description="The API returned no medication records." />}
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card attention-card">
          <SectionHeader icon={AlertTriangle} eyebrow="Review prompts" title="Signals requiring context" />
          <div className="attention-items">
            {risks.slice(0, 3).map((risk, index) => <button key={risk.id || index} className="attention-item" onClick={() => onNavigate('risks')}><span className={`attention-icon ${severityTone(risk.severity)}`}><AlertTriangle size={17} /></span><span><SeverityPill value={risk.severity} /><strong>{risk.title || risk.name || 'Risk signal'}</strong><small>{risk.summary || risk.description || 'Review transparent evidence.'}</small></span><ChevronRight size={16} /></button>)}
            {!risks.length && <EmptyState icon={ShieldCheck} title="No risk factors supplied" description="Rule-based risk results will appear here." />}
          </div>
          <div className="safety-note"><Info size={15} /><p>These are transparent prototype prompts derived from evidence, not diagnoses or treatment recommendations.</p></div>
        </section>
      </div>

      <div className="dashboard-grid dashboard-bottom-grid">
        <section className="surface-card timeline-card">
          <SectionHeader icon={Clock3} eyebrow="Chronological view" title="Clinical timeline" action={<button className="link-button" onClick={() => onNavigate('documents')}>View evidence <ArrowUpRight size={15} /></button>} />
          <div className="timeline">
            {timeline.slice(0, 6).map((event, index) => <TimelineItem key={event.id || index} event={event} onEvidence={onEvidence} />)}
            {!timeline.length && <EmptyState icon={Clock3} title="No timeline events supplied" description="Events will appear when records are available." />}
          </div>
        </section>

        <section className="surface-card labs-card">
          <SectionHeader icon={FlaskConical} eyebrow="Latest values" title="Lab results" action={<span className="muted-caption">Most recent records</span>} />
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead><tr><th>Test</th><th>Result</th><th>Flag</th></tr></thead>
              <tbody>{labs.slice(0, 6).map((lab, index) => <tr key={`${itemTitle(lab)}-${index}`}><td><strong>{itemTitle(lab)}</strong><small>{safeDate(lab.date || lab.result_date)}</small></td><td>{coalesce(lab.value, lab.result, '—')} <small>{lab.unit}</small></td><td><SeverityPill value={lab.flag || lab.status || 'Normal'} /></td></tr>)}</tbody>
            </table>
            {!labs.length && <EmptyState icon={FlaskConical} title="No laboratory results supplied" description="The API returned no lab records." />}
          </div>
        </section>
      </div>

      <div className="dashboard-grid dashboard-bottom-grid utility-grid">
        <section className="surface-card compact-card">
          <SectionHeader icon={ShieldAlert} eyebrow="Safety record" title="Allergies" />
          {allergies.length ? <div className="stacked-records">{allergies.map((item, index) => <div className="record-row" key={`${itemTitle(item)}-${index}`}><span className="record-icon red"><ShieldAlert size={15} /></span><div><strong>{itemTitle(item, ['allergen', 'name', 'title'])}</strong><small>{[item.reaction, item.severity].filter(Boolean).join(' · ') || 'Reaction not recorded'}</small></div><SeverityPill value={item.severity || 'Active'} /></div>)}</div> : <EmptyState icon={ShieldCheck} title="No known allergies" description="No allergy records were supplied by the API." />}
        </section>
        <section className="surface-card compact-card">
          <SectionHeader icon={CalendarDays} eyebrow="Care utilization" title="Recent encounters" />
          {encounters.length ? <div className="stacked-records">{encounters.slice(0, 3).map((item, index) => <div className="record-row" key={`${item.date}-${index}`}><span className="record-icon blue"><CalendarDays size={15} /></span><div><strong>{itemTitle(item, ['type', 'title', 'reason'])}</strong><small>{safeDate(item.date)} · {coalesce(item.reason, item.disposition, 'Encounter record')}</small></div></div>)}</div> : <EmptyState icon={CalendarDays} title="No encounters supplied" description="No encounter records were returned." />}
        </section>
        <section className="surface-card compact-card">
          <SectionHeader icon={CreditCard} eyebrow="Claims / utilization" title="Recent services" />
          {claims.length ? <div className="stacked-records">{claims.slice(0, 3).map((item, index) => <div className="record-row" key={`${item.date}-${index}`}><span className="record-icon violet"><CreditCard size={15} /></span><div><strong>{itemTitle(item, ['service', 'title', 'category'])}</strong><small>{safeDate(item.date)} · {coalesce(item.category, item.status, 'Utilization record')}</small></div><strong className="claim-amount">{formatAmount(coalesce(item.amount, item.paid_amount, ''))}</strong></div>)}</div> : <EmptyState icon={CreditCard} title="No claims supplied" description="No utilization records were returned." />}
        </section>
      </div>
    </>
  )
}

function TimelineItem({ event, onEvidence }) {
  const type = `${event.type || event.event_type || ''}`.toLowerCase()
  const Icon = type.includes('lab') ? FlaskConical : type.includes('document') ? FileText : type.includes('med') ? Pill : CalendarDays
  const citation = event.citation || event.evidence || (event.citation_id ? demoCitations.find((item) => item.id === event.citation_id) : null)
  return (
    <div className="timeline-item">
      <div className="timeline-rail"><span className={`timeline-icon ${type || 'event'}`}><Icon size={14} /></span></div>
      <div className="timeline-date">{safeDate(event.date || event.event_date)}</div>
      <div className="timeline-content"><strong>{event.title || event.name || 'Clinical event'}</strong><p>{event.detail || event.description || event.summary || 'Event detail not supplied.'}</p>{citation && <button className="citation-link inline-citation" onClick={() => onEvidence(citation)}>Evidence <ExternalLink size={12} /></button>}</div>
    </div>
  )
}

function CopilotPage({ patient, onEvidence, apiMode }) {
  const welcome = useMemo(() => ({
    id: 'intro',
    role: 'assistant',
    answer: `I’m ready to search ${patient.name}’s structured synthetic records and local evidence. Ask a question and I’ll separate retrieved facts from transparent prototype inference, with source citations.`,
    citations: [],
  }), [patient.patient_id])
  const [messages, setMessages] = useState([welcome])
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { setMessages([welcome]); setQuestion('') }, [welcome])

  async function submitQuestion(event, proposedQuestion) {
    event?.preventDefault()
    const cleanQuestion = `${proposedQuestion ?? question}`.trim()
    if (!cleanQuestion || sending) return
    const userMessage = { id: `user-${Date.now()}`, role: 'user', question: cleanQuestion }
    setMessages((current) => [...current, userMessage])
    setQuestion('')
    setSending(true)
    try {
      const result = await queryCopilot(patient.patient_id, cleanQuestion)
      const citations = normaliseCitations(result)
      setMessages((current) => [...current, {
        id: `answer-${Date.now()}`,
        role: 'assistant',
        answer: result.answer || result.response || 'The API returned no narrative answer.',
        facts: result.retrieved_facts || result.facts || [],
        citations,
        mode: result.mode || (result.generation_mode === 'deterministic_grounded_fallback' ? 'deterministic_fallback' : 'api'),
      }])
    } catch {
      const result = buildDemoResponse(cleanQuestion, patient)
      setMessages((current) => [...current, { id: `answer-${Date.now()}`, role: 'assistant', ...result }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="copilot-layout">
      <section className="surface-card copilot-main">
        <div className="copilot-titlebar">
          <div className="copilot-orb"><Sparkles size={20} /></div>
          <div><p className="eyebrow">Grounded retrieval</p><h1>Evidence Copilot</h1><p>Ask about the selected synthetic patient. Every important claim is traceable.</p></div>
          <span className={`copilot-status ${apiMode === 'live' ? 'online' : ''}`}><span />{apiMode === 'live' ? 'API connected' : 'Local demo ready'}</span>
        </div>

        <div className="chat-scroll">
          {messages.map((message) => <ChatMessage key={message.id} message={message} onEvidence={onEvidence} />)}
          {sending && <div className="chat-message assistant-message"><span className="chat-avatar bot-avatar"><Bot size={17} /></span><div className="typing-bubble"><i /><i /><i /></div></div>}
        </div>

        <div className="prompt-strip">
          <span><Sparkles size={14} /> Suggested</span>
          <div>{prompts.map((prompt) => <button key={prompt} onClick={(event) => submitQuestion(event, prompt)}>{prompt}</button>)}</div>
        </div>
        <form className="copilot-input" onSubmit={submitQuestion}>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitQuestion() } }} placeholder={`Ask about ${patient.name}'s synthetic record…`} rows="1" />
          <button type="submit" disabled={!question.trim() || sending} aria-label="Send question"><Send size={18} /></button>
        </form>
        <p className="copilot-disclaimer"><ShieldCheck size={13} /> Answers are grounded in retrieved synthetic records. Prototype inference is explicitly labelled.</p>
      </section>

      <aside className="copilot-side">
        <section className="surface-card evidence-guide-card">
          <div className="guide-icon"><BookOpen size={20} /></div>
          <p className="eyebrow">Evidence discipline</p>
          <h2>How this answer is built</h2>
          <ol className="evidence-flow"><li><span>1</span>Patient record retrieval</li><li><span>2</span>Local evidence matching</li><li><span>3</span>Fact / inference separation</li><li><span>4</span>Inspectable citations</li></ol>
        </section>
        <section className="surface-card quick-context-card">
          <SectionHeader icon={UsersRound} eyebrow="Selected profile" title={patient.name} />
          <div className="quick-context-row"><Stethoscope size={16} /><span>{asArray(patient.conditions).length} active conditions</span></div>
          <div className="quick-context-row"><Pill size={16} /><span>{asArray(patient.medications).length} active medications</span></div>
          <div className="quick-context-row"><FlaskConical size={16} /><span>{asArray(patient.lab_results).length} available labs</span></div>
        </section>
      </aside>
    </div>
  )
}

function ChatMessage({ message, onEvidence }) {
  if (message.role === 'user') return <div className="chat-message user-message"><div className="user-bubble">{message.question}</div><span className="chat-avatar user-avatar">You</span></div>
  const paragraphs = `${message.answer || ''}`.split('\n\n').filter(Boolean)
  const citations = asArray(message.citations)
  return (
    <div className="chat-message assistant-message">
      <span className="chat-avatar bot-avatar"><Bot size={17} /></span>
      <div className="assistant-bubble">
        {paragraphs.map((paragraph, index) => <p key={index} className={paragraph.startsWith('Retrieved facts:') ? 'retrieved-text' : paragraph.startsWith('Inference:') ? 'inference-text' : ''}>{paragraph}</p>)}
        {asArray(message.facts).length > 0 && <div className="facts-block"><span><CheckCircle2 size={14} /> Retrieved facts</span><ul>{message.facts.map((fact, index) => <li key={index}>{typeof fact === 'string' ? fact : itemTitle(fact)}</li>)}</ul></div>}
        {citations.length > 0 && <div className="answer-citations"><p><BookOpen size={14} /> Sources / Evidence</p><div>{citations.map((citation, index) => <button className="citation-card" key={citation.id || index} onClick={() => onEvidence(citation)}><span>[{index + 1}]</span><span><strong>{citation.title || citation.source}</strong><small>{citation.section || citation.date || 'Evidence record'}</small></span><ExternalLink size={14} /></button>)}</div></div>}
        {message.mode === 'deterministic_fallback' && <span className="answer-mode"><Info size={12} /> Deterministic local demo response</span>}
      </div>
    </div>
  )
}

function DocumentsPage({ documents, onEvidence }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All sources')
  const documentTypes = ['All sources', ...new Set(documents.map((doc) => doc.document_type || doc.type || 'Document'))]
  const filtered = documents.filter((document) => {
    const sections = asArray(document.sections ?? document.chunks)
      .map((section) => `${section.heading || section.section || ''} ${section.text || section.excerpt || section.content || ''}`)
      .join(' ')
    const text = `${document.title} ${document.document_type || document.type || document.source_type} ${document.source} ${document.content || ''} ${sections}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (type === 'All sources' || (document.document_type || document.type || 'Document') === type)
  })
  return (
    <div className="documents-page">
      <section className="page-heading-block">
        <div><p className="eyebrow">Inspectable provenance</p><h1>Documents &amp; Evidence</h1><p>Explore local synthetic source material that supports evidence-backed answers and rule-based risk signals.</p></div>
        <div className="heading-stats"><span><FileText size={16} />{documents.length} source records</span><SyntheticTag compact /></div>
      </section>
      <div className="document-toolbar">
        <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search source content" /></label>
        <div className="filter-select"><span>Type</span><select value={type} onChange={(event) => setType(event.target.value)}>{documentTypes.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div>
      </div>
      <div className="document-grid">
        {filtered.map((document, index) => <DocumentCard key={document.document_id || document.id || index} document={document} onEvidence={onEvidence} />)}
        {!filtered.length && <EmptyState icon={Search} title="No matching evidence" description="Try a broader search or select another source type." />}
      </div>
      <section className="evidence-principles surface-card">
        <div className="principle-icon"><ShieldCheck size={20} /></div>
        <div><p className="eyebrow">Transparency built in</p><h2>Evidence is presented as source material, not hidden context.</h2><p>Every citation exposes its source, section, date, and relevant synthetic excerpt. The app distinguishes those records from the prototype’s rule-based inferences.</p></div>
      </section>
    </div>
  )
}

function DocumentCard({ document, onEvidence }) {
  const sections = asArray(document.sections ?? document.chunks)
  const excerpt = coalesce(document.excerpt, document.content, sections[0]?.text, sections[0]?.content, 'No source excerpt supplied.')
  const citation = {
    id: coalesce(document.id, document.document_id),
    source: document.source || 'Synthetic evidence library',
    title: document.title || 'Synthetic source document',
    section: sections[0]?.heading || sections[0]?.section || document.section || 'Document overview',
    date: document.date || document.created_at,
    excerpt,
    document_id: document.document_id || document.id,
    record_type: 'document',
    ...document,
  }
  return <article className="document-card"><div className="document-card-top"><span className="doc-type-icon"><FileText size={19} /></span><div><span className="document-type">{document.document_type || document.type || 'Evidence document'}</span><h2>{document.title || 'Synthetic source document'}</h2></div></div><p className="document-excerpt">{excerpt}</p><div className="document-meta"><span><CalendarDays size={14} />{safeDate(document.date || document.created_at)}</span><span>{document.source || 'Synthetic source library'}</span></div><button className="document-open" onClick={() => onEvidence(citation)}>Inspect evidence <ArrowUpRight size={16} /></button></article>
}

function RisksPage({ patient, risks, onEvidence }) {
  const allFactors = risks.flatMap((risk) => asArray(risk.factors ?? risk.evidence ?? risk.reasons).map((factor) => ({ ...factor, riskTitle: risk.title || risk.name, riskSeverity: risk.severity })))
  return (
    <div className="risks-page">
      <section className="page-heading-block risk-heading">
        <div><p className="eyebrow">Transparent stratification</p><h1>Risk &amp; Insights</h1><p>Evidence-based prototype rules for <strong>{patient.name}</strong>. These signals are explainable review prompts, never a diagnosis.</p></div>
        <div className="heading-stats"><span className="risk-stat"><ShieldAlert size={16} />{risks.length} rule sets</span><SyntheticTag compact /></div>
      </section>
      <div className="risk-intro surface-card"><span className="risk-intro-icon"><BrainCircuit size={22} /></span><div><strong>How this works</strong><p>Each flag is calculated from explicit synthetic conditions, labs, medications, and evidence documents. Click any cited source to inspect the underlying record.</p></div><div className="rule-chain"><span>Records</span><ChevronRight size={15} /><span>Rules</span><ChevronRight size={15} /><span>Review prompt</span></div></div>
      <div className="risk-card-grid">
        {risks.map((risk, index) => <RiskCard key={risk.id || index} risk={risk} onEvidence={onEvidence} />)}
        {!risks.length && <EmptyState icon={ShieldCheck} title="No risk signals returned" description="The API did not return transparent risk factors for this profile." />}
      </div>
      <section className="surface-card factor-table-card">
        <SectionHeader icon={TrendingUp} eyebrow="Evidence matrix" title="Rule inputs &amp; sources" />
        {allFactors.length ? <div className="risk-table-wrap"><table className="risk-table"><thead><tr><th>Risk factor</th><th>Evidence</th><th>Severity</th><th>Source</th></tr></thead><tbody>{allFactors.map((factor, index) => {
          const citation = factor.citation || factor.source_record || (factor.citation_id ? demoCitations.find((item) => item.id === factor.citation_id) : null)
          return <tr key={factor.id || index}><td><strong>{factor.factor || factor.title || factor.name || 'Rule input'}</strong><small>{factor.riskTitle}</small></td><td>{factor.evidence || factor.description || 'Evidence detail not supplied.'}</td><td><SeverityPill value={factor.severity || factor.riskSeverity} /></td><td>{citation ? <button className="citation-link" onClick={() => onEvidence(citation)}>{citation.source || 'Open source'} <ExternalLink size={12} /></button> : <span className="muted-caption">No linked source</span>}</td></tr>
        })}</tbody></table></div> : <EmptyState icon={TrendingUp} title="No rule inputs returned" description="Evidence factors will appear with risk results." />}
      </section>
      <div className="medical-boundary"><Info size={17} /><p><strong>Prototype boundary:</strong> The risk summary is a transparent evidence-retrieval demonstration using synthetic data. It should not be used for diagnosis, treatment, benefit determination, or clinical decision-making.</p></div>
    </div>
  )
}

function RiskCard({ risk, onEvidence }) {
  const factors = asArray(risk.factors ?? risk.evidence ?? risk.reasons)
  return <section className={`risk-card risk-${severityTone(risk.severity)}`}><div className="risk-card-head"><span className="risk-card-icon"><ShieldAlert size={20} /></span><div><SeverityPill value={risk.severity || 'Review'} /><h2>{risk.title || risk.name || 'Rule-based risk signal'}</h2></div></div><p>{risk.summary || risk.description || 'This rule combines available synthetic records.'}</p><div className="risk-factor-list">{factors.map((factor, index) => { const citation = factor.citation || factor.source_record || (factor.citation_id ? demoCitations.find((item) => item.id === factor.citation_id) : null); return <div className="risk-factor" key={factor.id || index}><span className="factor-check"><CheckCircle2 size={15} /></span><div><strong>{factor.factor || factor.title || factor.name || 'Evidence factor'}</strong><small>{factor.evidence || factor.description || 'Evidence detail not supplied.'}</small>{citation && <button className="citation-link" onClick={() => onEvidence(citation)}>{citation.source || 'Inspect source'} <ExternalLink size={12} /></button>}</div><SeverityPill value={factor.severity} /></div> })}</div><div className="rule-label"><BrainCircuit size={14} /> Explicit prototype rule · inspectable evidence</div></section>
}

function EvidenceDrawer({ citation, documents, onClose }) {
  if (!citation) return null
  const matchingDocument = documents.find((document) => (document.document_id || document.id) === citation.document_id || (document.document_id || document.id) === citation.record_id)
  const sections = asArray(matchingDocument?.sections ?? matchingDocument?.chunks)
  async function copyCitation() {
    try { await navigator.clipboard.writeText(`${citation.source} — ${citation.title}${citation.section ? ` — ${citation.section}` : ''}`) } catch { /* Clipboard access is optional in this local demo. */ }
  }
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="evidence-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-header"><div><span className="drawer-kicker"><BookOpen size={14} /> Source evidence</span><h2 id="evidence-title">{citation.title || citation.source || 'Evidence record'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close evidence"><X size={20} /></button></div>
        <div className="drawer-meta"><SeverityPill value={citation.record_type || citation.source || 'Evidence'} /><span><CalendarDays size={14} />{safeDate(citation.date)}</span></div>
        <section className="evidence-excerpt"><p className="eyebrow">Relevant excerpt</p><blockquote>“{citation.excerpt || citation.text || citation.content || 'No excerpt supplied by this evidence record.'}”</blockquote><span>{citation.section || 'Record detail'}</span></section>
        <section className="evidence-provenance"><p className="eyebrow">Provenance</p><dl><div><dt>Source</dt><dd>{citation.source || 'Evidence record'}</dd></div><div><dt>Section / record</dt><dd>{citation.section || citation.record_id || 'Not supplied'}</dd></div><div><dt>Source ID</dt><dd>{citation.document_id || citation.record_id || citation.id || 'Not supplied'}</dd></div></dl></section>
        {matchingDocument && <section className="source-sections"><p className="eyebrow">Source document</p>{sections.map((section, index) => <article key={index}><strong>{section.heading || section.section || `Section ${index + 1}`}</strong><p>{section.text || section.content || section.excerpt}</p></article>)}</section>}
        <div className="drawer-footer"><button className="secondary-button" onClick={copyCitation}><Copy size={15} /> Copy citation</button><button className="primary-button" onClick={onClose}>Done</button></div>
      </aside>
    </div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState('patient')
  const [patients, setPatients] = useState(demoPatients)
  const [patientId, setPatientId] = useState(demoPatient.patient_id)
  const [patient, setPatient] = useState(demoPatient)
  const [timeline, setTimeline] = useState(demoTimeline)
  const [risks, setRisks] = useState(demoRisks)
  const [documents, setDocuments] = useState(demoDocuments)
  const [loading, setLoading] = useState(true)
  const [apiMode, setApiMode] = useState('demo')
  const [menuOpen, setMenuOpen] = useState(false)
  const [evidence, setEvidence] = useState(null)

  async function loadPatients() {
    try {
      const result = await getPatients()
      if (result.length) {
        setPatients(result)
        setPatientId((current) => result.some((entry) => entry.patient_id === current) ? current : result[0].patient_id)
        return true
      }
    } catch { /* The local demo fallback stays available when the API is offline. */ }
    setPatients(demoPatients)
    return false
  }

  async function loadPatientBundle(id) {
    setLoading(true)
    const results = await Promise.allSettled([getPatient(id), getTimeline(id), getRisks(id), getDocuments(id)])
    const [profile, timelineResult, risksResult, documentsResult] = results
    const allLive = results.every((result) => result.status === 'fulfilled')
    setPatient(profile.status === 'fulfilled' ? profile.value : fallbackProfile(id))
    setTimeline(timelineResult.status === 'fulfilled' && timelineResult.value.length ? timelineResult.value : demoTimeline)
    setRisks(risksResult.status === 'fulfilled' && risksResult.value.length ? risksResult.value : demoRisks)
    setDocuments(documentsResult.status === 'fulfilled' && documentsResult.value.length ? documentsResult.value : demoDocuments)
    setApiMode(allLive ? 'live' : 'demo')
    setLoading(false)
  }

  useEffect(() => { loadPatients() }, [])
  useEffect(() => { loadPatientBundle(patientId) }, [patientId])

  const page = loading ? <PageLoader /> : activePage === 'copilot' ? <CopilotPage patient={patient} onEvidence={setEvidence} apiMode={apiMode} /> : activePage === 'documents' ? <DocumentsPage documents={documents} onEvidence={setEvidence} /> : activePage === 'risks' ? <RisksPage patient={patient} risks={risks} onEvidence={setEvidence} /> : <PatientPage patient={patient} timeline={timeline} risks={risks} documents={documents} onNavigate={setActivePage} onEvidence={setEvidence} />

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} patient={patient} menuOpen={menuOpen} onCloseMenu={() => setMenuOpen(false)} />
      {menuOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <main className="main-shell">
        <Header patients={patients} patient={patient} activePage={activePage} onPatientChange={setPatientId} onMenuClick={() => setMenuOpen(true)} apiMode={apiMode} onReload={() => { loadPatients(); loadPatientBundle(patientId) }} />
        <div className="page-content">{page}</div>
      </main>
      <EvidenceDrawer citation={evidence} documents={documents} onClose={() => setEvidence(null)} />
    </div>
  )
}
