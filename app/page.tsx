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

export default function Home() {
  const [stage, setStage] = useState<'triage' | 'urgent' | 'standard' | 'status' | 'submitted'>('triage');
  const [story, setStory] = useState(demoStory);
  const [triage, setTriage] = useState<TriageResult>(() => classifyWithRules(demoStory));
  const [triageReason, setTriageReason] = useState('We will show you why this route was chosen.');
  const [triageLoading, setTriageLoading] = useState(false);
  const [amount, setAmount] = useState('₹18,500');
  const [approximateTime, setApproximateTime] = useState('We don\'t know this yet.');
  const [platform, setPlatform] = useState('We don\'t know this yet.');
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

  function chooseJourney(journey: Journey) {
    const result = overrideTriage(journey);
    setTriage(result); setStage(journey); setDescription(story); setAiError('');
  }

  async function continueFromFreeText() {
    if (!story.trim()) return;
    setTriageLoading(true); setAiError('');
    try {
      const result = await aiTriage(story);
      setTriage(overrideTriage(result.journey)); setTriageReason(result.reason); setStage(result.journey); setDescription(story);
    } catch {
      const fallback = classifyWithRules(story);
      setTriage(fallback); setTriageReason(`AI unavailable, so the transparent fallback chose: ${fallback.label}. You can override it.`); setStage(fallback.journey); setDescription(story);
      setAiError('OpenAI is unavailable. The prototype used its deterministic fallback.');
    } finally { setTriageLoading(false); }
  }

  async function generateDraft() {
    setAiLoading(true); setAiError('');
    try { const result = await aiDraft({ story: description, amount, approximateTime, platform }); setDraft(result); setDraftSummary(result.summary); }
    catch { setDraft(extractIncidentDraft(description)); setDraftSummary('AI drafting is unavailable, so this preview uses deterministic extraction.'); setAiError('Add OPENAI_API_KEY to enable live OpenAI drafting.'); }
    finally { setAiLoading(false); }
  }

  async function explainScam() {
    try {
      const signal = scam.signature ? `${scam.signature.kind}: ${scam.signature.label}` : 'No deterministic signature matched.';
      const result = await aiScamReason({ query: scamInput, result: scam.result, signal }); setScamExplanation(result.explanation);
    } catch { setScamExplanation('AI reasoning is unavailable. The deterministic verdict remains authoritative.'); }
  }

  function submitMockReport() { setAck(`FR-DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`); setStage('submitted'); }

  return (
    <main className="app-shell">
      <div className="page-frame">
        <div className="brand-row">
          <div className="brand"><span className="brand-mark" aria-hidden="true">FR</span><span>First Response</span></div>
          <span className="brand-subtle">Citizen triage</span>
        </div>

        {stage === 'triage' && <>
          <header>
            <p className="eyebrow">Triage · Act · Report · Track</p>
            <h1 className="hero-title">Start with what happened — not a legal category.</h1>
            <p className="hero-copy">Tell us what is happening first. The next step should change with the urgency of the situation.</p>
          </header>

          <section aria-labelledby="triage-heading">
            <h2 id="triage-heading" className="section-label">What do you need right now?</h2>
            <div className="triage-stack">
              <LargeActionButton tone="danger" onClick={() => chooseJourney('urgent')}>Money is being taken from my account right now.</LargeActionButton>
              <LargeActionButton tone="calm" onClick={() => chooseJourney('standard')}>Something happened and I want to report it.</LargeActionButton>
              <LargeActionButton onClick={() => chooseJourney('status')}>I want to check a complaint I already filed.</LargeActionButton>
            </div>
          </section>

          <section className="own-words" aria-labelledby="own-words-heading">
            <h2 id="own-words-heading" className="own-words-title">Or tell us in your own words</h2>
            <textarea aria-label="Describe what happened" className="textarea-main" value={story} onChange={(e) => setStory(e.target.value)} />
            <p className="ai-note mt-3">We will show the route we choose. You can always override it.</p>
            <button disabled={triageLoading || !story.trim()} onClick={continueFromFreeText} className="action-solid action-navy mt-3">{triageLoading ? 'Understanding…' : 'Continue with AI triage'}</button>
            <div className={`route-banner ${triage.journey === 'urgent' ? 'urgent' : triage.journey === 'standard' ? 'standard' : 'status'}`}>
              <p className="route-label">Chosen route</p>
              <p className="route-name">{triage.label}</p>
              <p className="mt-1 text-sm opacity-90">{triageReason}</p>
            </div>
            {aiError && <p role="status" className="error-panel mt-3 text-sm font-bold">{aiError}</p>}
          </section>
        </>}

        {stage === 'urgent' && <section className="space-y-4">
          <div className="route-banner urgent mt-0"><p className="route-label">Chosen route · Urgent</p><p className="route-name">Act first. Report second.</p><p className="mt-1 text-sm opacity-90">The route changed because the situation may be time-sensitive.</p></div>
          <div className="urgent-panel">
            <p className="eyebrow !text-white opacity-80">Immediate action</p>
            <h2>Call 1930 now</h2>
            <p>If money is moving right now, getting help quickly matters more than finishing a form.</p>
            <button className="action-solid action-navy !bg-white !text-[#D6432E]">Simulate call prompt</button>
            <p className="mt-2 text-xs font-semibold opacity-85">Mock only — this button does not place a call or freeze an account.</p>
          </div>
          <ReviewSection title="Auto-drafted complaint — editable">
            <p className="text-sm">Nothing here should be treated as confirmed until you review it.</p>
            <textarea aria-label="Incident description" className="textarea-main" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid grid-cols-1 gap-2"><input aria-label="Amount" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} /><input aria-label="Approximate time" className="field" value={approximateTime} onChange={(e) => setApproximateTime(e.target.value)} /><input aria-label="Bank or payment platform" className="field" value={platform} onChange={(e) => setPlatform(e.target.value)} /></div>
            <button onClick={generateDraft} disabled={aiLoading} className="action-solid action-teal">{aiLoading ? 'Drafting with OpenAI…' : 'Draft with OpenAI'}</button>
            {draftSummary && <p className="info-panel font-semibold">{draftSummary}</p>}
            <ul className="list-inside list-disc text-sm"><li>Amount: {draft.amount}</li><li>Possible incident: {draft.approximateIncidentType}</li><li>Possible evidence: {draft.possibleEvidence.join(', ')}</li><li>Missing: {draft.missing.join(', ')}</li></ul>
          </ReviewSection>
          <button onClick={submitMockReport} className="action-solid action-navy">Create mock report</button>
          <button onClick={() => setStage('triage')} className="w-full p-3 font-bold text-[#4C5578]">Change route</button>
        </section>}

        {stage === 'standard' && <section className="space-y-4">
          <div className="route-banner standard mt-0"><p className="route-label">Chosen route · Standard</p><p className="route-name">Calm reporting</p><p className="mt-1 text-sm opacity-90">No emergency action is being simulated. We can take time to structure the report.</p></div>
          <div className="screen-heading"><p className="eyebrow">Standard path</p><h2>Tell the story first. We will structure it.</h2></div>
          <ReviewSection title="Incident details">
            <textarea aria-label="Incident description" className="textarea-main" value={description} onChange={(e) => setDescription(e.target.value)} />
            {characterGuard.blocked && <div role="alert" className="warning"><strong>Character warning:</strong> {characterGuard.message}</div>}
            <p className="text-xs text-[#4C5578]">We preserve your original text in this prototype; this warning is informational and never silently edits evidence.</p>
            <input aria-label="Amount" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Approximate amount" />
            <input aria-label="Approximate time" className="field" value={approximateTime} onChange={(e) => setApproximateTime(e.target.value)} placeholder="Approximate time" />
            <input aria-label="Bank or payment platform" className="field" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Bank or payment platform" />
          </ReviewSection>
          <ReviewSection title="Optional scam check">
            <p className="text-sm">Check one URL, UPI ID or phone number against our small synthetic signature set. “Not found” never means safe.</p>
            <input aria-label="URL, UPI ID or phone" className="field" value={scamInput} onChange={(e) => { setScamInput(e.target.value); setScamExplanation(''); }} />
            <div className="info-panel"><p className="font-black">{scam.result}</p><p className="text-sm">{scam.message}</p></div>
            <button onClick={explainScam} className="action-solid action-navy">Explain this result with OpenAI</button>
            {scamExplanation && <p className="info-panel text-sm font-semibold">{scamExplanation}</p>}
          </ReviewSection>
          <label className="flex gap-3 rounded-2xl border border-[#D9DEEA] bg-white/80 p-4 font-bold"><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} /> I reviewed this mock report and approve it.</label>
          <button disabled={!approved} onClick={submitMockReport} className="action-solid action-teal">Submit mock report</button>
          <button onClick={() => setStage('triage')} className="w-full p-3 font-bold text-[#4C5578]">Change route</button>
        </section>}

        {stage === 'status' && <section className="space-y-4">
          <div className="route-banner status mt-0"><p className="route-label">Chosen route · Status check</p><p className="route-name">Understand what happens next.</p></div>
          <div className="screen-heading"><p className="eyebrow">Status check</p><h2>Understand what your status means.</h2></div>
          <ReviewSection title="Mock acknowledgment number"><p className="reference text-xl font-black">FR-DEMO-2026-0812</p><p className="text-sm">This is a synthetic reference, not a real complaint number.</p></ReviewSection>
          <p className="info-panel font-bold">Typical cases like this take {range.min}–{range.max} days. You are viewing simulated day 6.</p>
          {statuses.map((status) => <ReviewSection key={status.state} title={`${status.title} · day ${status.simulatedDay}`}><p><strong>What it means:</strong> {status.meaning}</p><p><strong>What happens next:</strong> {status.next}</p><p><strong>Your action:</strong> {status.citizenAction}</p></ReviewSection>)}
          <button onClick={() => setStage('triage')} className="w-full p-3 font-bold text-[#4C5578]">Back to triage</button>
        </section>}

        {stage === 'submitted' && <section className="space-y-4">
          <div className="route-banner standard mt-0"><p className="route-label">Mock report created</p><p className="route-name">You have a reference.</p><p className="mt-1 text-sm opacity-90">Your prototype report is saved only in this simulated journey.</p></div>
          <ReviewSection title="Acknowledgment number"><p className="reference text-xl font-black">{ack}</p><p className="text-sm">Synthetic demo reference — not a real government complaint number.</p></ReviewSection>
          <button onClick={() => setStage('status')} className="action-solid action-teal">View simulated status</button>
          <button onClick={() => setStage('triage')} className="w-full p-3 font-bold text-[#4C5578]">Start another demo journey</button>
        </section>}

        <footer className="footer-disclosure"><PrototypeBanner /></footer>
      </div>
    </main>
  );
}
