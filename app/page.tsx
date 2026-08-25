'use client';

import { useMemo, useState } from 'react';
import { aiDraft, aiScamReason, aiTriage } from '../ai/openaiClient';
import { extractIncidentDraft } from '../ai/extractIncidentDraft';
import { PrototypeBanner } from '../components/PrototypeBanner';
import { LargeActionButton } from '../components/LargeActionButton';
import { ReviewSection } from '../components/ReviewSection';
import { syntheticHistoricalCases } from '../data/syntheticCases';
import { scamCheck } from '../scam-check/scamCheck';
import { buildStatusTimeline, calculateTypicalRange } from '../status/statusMachine';
import { classifyWithRules, overrideTriage, type TriageResult } from '../triage/triageRules';
import { checkIncidentCharacters } from '../validation/characterGuard';
import type { Journey } from '../types/models';

const demoStory = 'A caller pretended to be from my bank and I transferred ₹18,500.';

type Stage = 'triage' | 'urgent' | 'standard' | 'status' | 'submitted';

function ChatHelper({ onRoute }: { onRoute: (journey: Journey, reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');

  async function ask() {
    if (!text.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const result = await aiTriage(text.trim());
      setAnswer(result.reason);
      onRoute(result.journey, result.reason);
    } catch {
      const fallback = classifyWithRules(text.trim());
      setAnswer(`I would start with ${fallback.label}. You can choose another route if that feels wrong.`);
      onRoute(fallback.journey, `AI helper fallback: ${fallback.label}.`);
    } finally { setLoading(false); }
  }

  return <div className="ai-helper">
    {open && <div className="ai-helper-panel" role="dialog" aria-label="First Response AI helper">
      <div className="ai-helper-head"><span className="ai-dot">✦</span><div><strong>Ask First Response</strong><small>Describe the situation. I’ll help you choose a path.</small></div></div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened?" aria-label="Ask First Response" />
      {answer && <p className="ai-helper-answer">{answer}</p>}
      <button type="button" onClick={ask} disabled={loading || !text.trim()}>{loading ? 'Thinking…' : 'Help me choose'}</button>
    </div>}
    <button type="button" className="ai-helper-button" onClick={() => setOpen((v) => !v)} aria-label="Open AI helper"><span>✦</span><small>AI</small></button>
  </div>;
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('triage');
  const [story, setStory] = useState('');
  const [showDescribe, setShowDescribe] = useState(false);
  const [triage, setTriage] = useState<TriageResult>(() => classifyWithRules(demoStory));
  const [triageReason, setTriageReason] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);
  const [amount, setAmount] = useState('₹18,500');
  const [approximateTime, setApproximateTime] = useState("We don't know this yet.");
  const [platform, setPlatform] = useState("We don't know this yet.");
  const [description, setDescription] = useState(demoStory);
  const [draft, setDraft] = useState(() => extractIncidentDraft(demoStory));
  const [draftSummary, setDraftSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [scamInput, setScamInput] = useState('refund-help@upi');
  const [scamExplanation, setScamExplanation] = useState('');
  const [approved, setApproved] = useState(false);
  const [ack, setAck] = useState('FR-DEMO-2026-0812');

  const characterGuard = useMemo(() => checkIncidentCharacters(description), [description]);
  const scam = useMemo(() => scamCheck(scamInput), [scamInput]);
  const statuses = useMemo(() => buildStatusTimeline(syntheticHistoricalCases, triage.incidentType, 6), [triage.incidentType]);
  const range = useMemo(() => calculateTypicalRange(syntheticHistoricalCases, triage.incidentType), [triage.incidentType]);

  function route(journey: Journey, reason = '') {
    const result = overrideTriage(journey);
    setTriage(result);
    setTriageReason(reason);
    setDescription(story || demoStory);
    setAiError('');
    setStage(journey);
  }

  async function continueFromFreeText() {
    if (!story.trim()) return;
    setTriageLoading(true); setAiError('');
    try {
      const result = await aiTriage(story);
      route(result.journey, result.reason);
    } catch {
      const fallback = classifyWithRules(story);
      route(fallback.journey, `AI fallback chose ${fallback.label}. You can override it.`);
      setAiError('AI is unavailable, so the transparent rule-based fallback was used.');
    } finally { setTriageLoading(false); }
  }

  async function generateDraft() {
    setAiLoading(true); setAiError('');
    try { const result = await aiDraft({ story: description, amount, approximateTime, platform }); setDraft(result); setDraftSummary(result.summary); }
    catch { setDraft(extractIncidentDraft(description)); setDraftSummary('AI drafting is unavailable; this preview uses deterministic extraction.'); setAiError('Add OPENAI_API_KEY to enable live drafting.'); }
    finally { setAiLoading(false); }
  }

  async function explainScam() {
    try {
      const signal = scam.signature ? `${scam.signature.kind}: ${scam.signature.label}` : 'No deterministic signature matched.';
      const result = await aiScamReason({ query: scamInput, result: scam.result, signal }); setScamExplanation(result.explanation);
    } catch { setScamExplanation('AI reasoning is unavailable. The deterministic verdict remains authoritative.'); }
  }

  function submitMockReport() { setAck(`FR-DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`); setStage('submitted'); }

  return <main className="app-shell">
    <div className="page-frame">
      <div className="brand-row">
        <div className="brand"><span className="brand-mark" aria-hidden="true">FR</span><span>First Response</span></div>
        <span className="brand-subtle">Citizen triage</span>
      </div>

      {stage === 'triage' && <>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="hero-number">01</div>
          <p className="eyebrow">First Response</p>
          <h1 id="home-title" className="hero-title">What happened?</h1>
          <p className="hero-copy">Start there. We’ll figure out the right next step.</p>
          <div className="hero-steps"><span>01 Tell us</span><i /> <span>02 Act</span><i /> <span>03 Track</span></div>
        </section>

        <section className="home-actions" aria-labelledby="action-title">
          <div className="section-heading-row"><h2 id="action-title">Choose what fits</h2><span>3 paths</span></div>
          <div className="triage-stack">
            <LargeActionButton tone="danger" onClick={() => route('urgent')}>Money is being taken right now</LargeActionButton>
            <LargeActionButton tone="calm" onClick={() => route('standard')}>I need to report something</LargeActionButton>
            <LargeActionButton onClick={() => route('status')}>I already filed a complaint</LargeActionButton>
          </div>
        </section>

        <section className="describe-collapsed">
          <button type="button" onClick={() => setShowDescribe((v) => !v)} aria-expanded={showDescribe}>
            <span><b>Not sure?</b><small>Describe it in your own words</small></span><strong>{showDescribe ? '−' : '+'}</strong>
          </button>
          {showDescribe && <div className="describe-open">
            <textarea aria-label="Describe what happened" value={story} onChange={(e) => setStory(e.target.value)} placeholder="Example: Someone called pretending to be my bank…" />
            <button type="button" onClick={continueFromFreeText} disabled={triageLoading || !story.trim()} className="action-solid action-navy">{triageLoading ? 'Understanding…' : 'Let AI choose a path'}</button>
            {triageReason && <div className={`route-banner ${triage.journey === 'urgent' ? 'urgent' : triage.journey === 'standard' ? 'standard' : 'status'}`}><p className="route-label">Chosen route</p><p className="route-name">{triage.label}</p></div>}
            {aiError && <p role="status" className="error-panel mt-3 text-sm font-bold">{aiError}</p>}
          </div>}
        </section>

        <div className="home-spacer" aria-hidden="true" />
      </>}

      {stage === 'urgent' && <section className="space-y-4">
        <div className="route-banner urgent mt-0"><p className="route-label">Urgent route</p><p className="route-name">Act first. Report second.</p><p className="mt-1 text-sm opacity-90">Time can matter when money is moving.</p></div>
        <div className="urgent-panel"><p className="eyebrow !text-white opacity-80">Immediate action</p><h2>Call 1930 now</h2><p>Getting help quickly matters more than finishing a form.</p><button type="button" className="action-solid action-navy !bg-white !text-[#D6432E]">Simulate call prompt</button><p className="mt-2 text-xs font-semibold opacity-85">Mock only — no call or account freeze occurs.</p></div>
        <ReviewSection title="Auto-drafted complaint — editable"><p className="text-sm">Review before anything is submitted.</p><textarea aria-label="Incident description" className="textarea-main" value={description} onChange={(e) => setDescription(e.target.value)} /><div className="grid gap-2"><input aria-label="Amount" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} /><input aria-label="Approximate time" className="field" value={approximateTime} onChange={(e) => setApproximateTime(e.target.value)} /><input aria-label="Bank or payment platform" className="field" value={platform} onChange={(e) => setPlatform(e.target.value)} /></div><button type="button" onClick={generateDraft} disabled={aiLoading} className="action-solid action-teal">{aiLoading ? 'Drafting…' : 'Draft with OpenAI'}</button>{draftSummary && <p className="info-panel font-semibold">{draftSummary}</p>}<ul className="list-inside list-disc text-sm"><li>Amount: {draft.amount}</li><li>Incident: {draft.approximateIncidentType}</li><li>Evidence: {draft.possibleEvidence.join(', ')}</li><li>Missing: {draft.missing.join(', ')}</li></ul></ReviewSection>
        <button type="button" onClick={submitMockReport} className="action-solid action-navy">Create mock report</button><button type="button" onClick={() => setStage('triage')} className="w-full p-3 font-bold text-[#4C5578]">Change route</button>
      </section>}

      {stage === 'standard' && <section className="space-y-4"><div className="route-banner standard mt-0"><p className="route-label">Standard route</p><p className="route-name">Calm reporting</p></div><div className="screen-heading"><p className="eyebrow">Report</p><h2>Tell the story first.</h2><p>We’ll structure it for you.</p></div><ReviewSection title="Incident details"><textarea aria-label="Incident description" className="textarea-main" value={description} onChange={(e) => setDescription(e.target.value)} />{characterGuard.blocked && <div role="alert" className="warning"><strong>Character warning:</strong> {characterGuard.message}</div>}<input aria-label="Amount" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Approximate amount" /><input aria-label="Approximate time" className="field" value={approximateTime} onChange={(e) => setApproximateTime(e.target.value)} placeholder="Approximate time" /><input aria-label="Bank or payment platform" className="field" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Bank or payment platform" /></ReviewSection><ReviewSection title="Optional scam check"><p className="text-sm">Check one URL, UPI ID or phone against our synthetic signatures. Not found ≠ safe.</p><input aria-label="URL, UPI ID or phone" className="field" value={scamInput} onChange={(e) => { setScamInput(e.target.value); setScamExplanation(''); }} /><div className="info-panel"><p className="font-black">{scam.result}</p><p className="text-sm">{scam.message}</p></div><button type="button" onClick={explainScam} className="action-solid action-navy">Explain with OpenAI</button>{scamExplanation && <p className="info-panel text-sm font-semibold">{scamExplanation}</p>}</ReviewSection><label className="flex gap-3 rounded-2xl border border-[#D9DEEA] bg-white/80 p-4 font-bold"><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} /> I reviewed this mock report.</label><button type="button" disabled={!approved} onClick={submitMockReport} className="action-solid action-teal">Submit mock report</button><button type="button" onClick={() => setStage('triage')} className="w-full p-3 font-bold text-[#4C5578]">Change route</button></section>}

      {stage === 'status' && <section className="space-y-4"><div className="route-banner status mt-0"><p className="route-label">Status route</p><p className="route-name">See what happens next.</p></div><ReviewSection title="Acknowledgment number"><p className="reference text-xl font-black">FR-DEMO-2026-0812</p><p className="text-sm">Synthetic reference — not a real complaint number.</p></ReviewSection><p className="info-panel font-bold">Typical cases take {range.min}–{range.max} days. Simulated day 6.</p>{statuses.map((status) => <ReviewSection key={status.state} title={`${status.title} · day ${status.simulatedDay}`}><p><strong>Meaning:</strong> {status.meaning}</p><p><strong>Next:</strong> {status.next}</p><p><strong>Your action:</strong> {status.citizenAction}</p></ReviewSection>)}<button type="button" onClick={() => setStage('triage')} className="w-full p-3 font-bold text-[#4C5578]">Back to triage</button></section>}

      {stage === 'submitted' && <section className="space-y-4"><div className="route-banner standard mt-0"><p className="route-label">Mock report created</p><p className="route-name">Your reference is ready.</p></div><ReviewSection title="Acknowledgment number"><p className="reference text-xl font-black">{ack}</p><p className="text-sm">Synthetic demo reference.</p></ReviewSection><button type="button" onClick={() => setStage('status')} className="action-solid action-teal">View simulated status</button><button type="button" onClick={() => setStage('triage')} className="w-full p-3 font-bold text-[#4C5578]">Start again</button></section>}

      <footer className="footer-disclosure"><PrototypeBanner /></footer>
      <ChatHelper onRoute={route} />
    </div>
  </main>;
}
