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
  const [triageReason, setTriageReason] = useState('Rule-based preview. Free-text triage uses OpenAI when you continue.');
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
    setTriage(result);
    setStage(journey);
    setDescription(story);
    setAiError('');
  }

  async function continueFromFreeText() {
    if (!story.trim()) return;
    setTriageLoading(true);
    setAiError('');
    try {
      const result = await aiTriage(story);
      setTriage(overrideTriage(result.journey));
      setTriageReason(result.reason);
      setStage(result.journey);
      setDescription(story);
    } catch {
      const fallback = classifyWithRules(story);
      setTriage(fallback);
      setTriageReason(`AI unavailable, so the deterministic fallback chose: ${fallback.label}. You can override it below.`);
      setStage(fallback.journey);
      setDescription(story);
      setAiError('OpenAI is unavailable. The prototype used its transparent deterministic fallback.');
    } finally {
      setTriageLoading(false);
    }
  }

  async function generateDraft() {
    setAiLoading(true);
    setAiError('');
    try {
      const result = await aiDraft({ story: description, amount, approximateTime, platform });
      setDraft(result);
      setDraftSummary(result.summary);
    } catch {
      setDraft(extractIncidentDraft(description));
      setDraftSummary('AI drafting is unavailable, so this preview uses deterministic extraction only.');
      setAiError('Add OPENAI_API_KEY to enable the live OpenAI draft.');
    } finally {
      setAiLoading(false);
    }
  }

  async function explainScam() {
    try {
      const signal = scam.signature ? `${scam.signature.kind}: ${scam.signature.label}` : 'No deterministic signature matched.';
      const result = await aiScamReason({ query: scamInput, result: scam.result, signal });
      setScamExplanation(result.explanation);
    } catch {
      setScamExplanation('AI reasoning is unavailable. The deterministic verdict above remains authoritative.');
    }
  }

  function submitMockReport() {
    setAck(`FR-DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setStage('submitted');
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-4 bg-slate-50 p-4 pb-10">
      <PrototypeBanner />

      <header className="space-y-2">
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">First Response</p>
        <h1 className="text-3xl font-black leading-tight text-slate-950">Start with what happened — not a legal category.</h1>
        <p className="text-slate-700">Triage → act → report → track</p>
      </header>

      {stage === 'triage' && (
        <section className="space-y-3" aria-labelledby="triage-heading">
          <h2 id="triage-heading" className="text-xl font-black">What do you need right now?</h2>
          <LargeActionButton tone="danger" onClick={() => chooseJourney('urgent')}>
            Money is being taken from my account right now.
          </LargeActionButton>
          <LargeActionButton tone="calm" onClick={() => chooseJourney('standard')}>
            Something happened and I want to report it.
          </LargeActionButton>
          <LargeActionButton onClick={() => chooseJourney('status')}>
            I want to check a complaint I already filed.
          </LargeActionButton>

          <ReviewSection title="Or tell us in your own words">
            <textarea aria-label="Describe what happened" className="min-h-32 w-full rounded-2xl border p-3" value={story} onChange={(e) => setStory(e.target.value)} />
            <p className="text-sm font-semibold">We will show the route we choose. You can always override it.</p>
            <button disabled={triageLoading} onClick={continueFromFreeText} className="min-h-14 w-full rounded-2xl bg-slate-950 px-4 font-black text-white disabled:opacity-50">
              {triageLoading ? 'Understanding…' : 'Continue with AI triage'}
            </button>
            <div className="rounded-xl bg-slate-100 p-3 text-sm">
              <p className="font-black">Chosen route: {triage.journey}</p>
              <p>{triageReason}</p>
            </div>
            {aiError && <p role="status" className="text-sm font-bold text-amber-800">{aiError}</p>}
          </ReviewSection>
        </section>
      )}

      {stage === 'urgent' && (
        <section className="space-y-4" aria-labelledby="urgent-heading">
          <div className="rounded-3xl border-4 border-red-700 bg-red-50 p-5">
            <p className="text-sm font-black uppercase tracking-widest text-red-800">Act first</p>
            <h2 id="urgent-heading" className="mt-1 text-3xl font-black text-red-950">Call 1930 now</h2>
            <p className="mt-2 text-red-950">If money is moving right now, getting help quickly matters more than finishing a form.</p>
            <button className="mt-4 min-h-16 w-full rounded-2xl bg-red-700 px-4 text-xl font-black text-white">Simulate call prompt</button>
            <p className="mt-2 text-xs font-semibold text-red-900">Mock only — this button does not place a call or freeze an account.</p>
          </div>

          <ReviewSection title="Auto-drafted complaint — editable">
            <p className="text-sm">Nothing here should be treated as confirmed until you review it.</p>
            <textarea aria-label="Incident description" className="min-h-28 w-full rounded-xl border p-3" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid grid-cols-1 gap-2">
              <input aria-label="Amount" className="rounded-xl border p-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input aria-label="Approximate time" className="rounded-xl border p-3" value={approximateTime} onChange={(e) => setApproximateTime(e.target.value)} />
              <input aria-label="Bank or payment platform" className="rounded-xl border p-3" value={platform} onChange={(e) => setPlatform(e.target.value)} />
            </div>
            <button onClick={generateDraft} disabled={aiLoading} className="min-h-14 w-full rounded-2xl bg-blue-700 font-black text-white disabled:opacity-50">{aiLoading ? 'Drafting with OpenAI…' : 'Draft with OpenAI'}</button>
            {draftSummary && <p className="rounded-xl bg-blue-50 p-3 font-semibold">{draftSummary}</p>}
            <ul className="list-inside list-disc text-sm"><li>Amount: {draft.amount}</li><li>Possible incident: {draft.approximateIncidentType}</li><li>Possible evidence: {draft.possibleEvidence.join(', ')}</li><li>Missing: {draft.missing.join(', ')}</li></ul>
          </ReviewSection>
          <button onClick={submitMockReport} className="min-h-14 w-full rounded-2xl bg-slate-950 font-black text-white">Create mock report</button>
          <button onClick={() => setStage('triage')} className="w-full p-3 font-bold">Change route</button>
        </section>
      )}

      {stage === 'standard' && (
        <section className="space-y-4" aria-labelledby="standard-heading">
          <div><p className="text-sm font-black uppercase tracking-widest text-blue-700">Calm reporting</p><h2 id="standard-heading" className="text-2xl font-black">Tell the story first. We will structure it.</h2></div>
          <ReviewSection title="Incident details">
            <textarea aria-label="Incident description" className="min-h-36 w-full rounded-xl border p-3" value={description} onChange={(e) => setDescription(e.target.value)} />
            {characterGuard.blocked && <div role="alert" className="rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm font-semibold text-amber-950"><strong>Character warning:</strong> {characterGuard.message}</div>}
            <p className="text-xs text-slate-600">We preserve your original text in this prototype; this warning is informational and never silently edits evidence.</p>
            <input aria-label="Amount" className="w-full rounded-xl border p-3" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Approximate amount" />
            <input aria-label="Approximate time" className="w-full rounded-xl border p-3" value={approximateTime} onChange={(e) => setApproximateTime(e.target.value)} placeholder="Approximate time" />
            <input aria-label="Bank or payment platform" className="w-full rounded-xl border p-3" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Bank or payment platform" />
          </ReviewSection>

          <ReviewSection title="Optional scam check">
            <p className="text-sm">Check one URL, UPI ID or phone number against our small synthetic signature set. “Not found” never means safe.</p>
            <input aria-label="URL, UPI ID or phone" className="w-full rounded-xl border p-3" value={scamInput} onChange={(e) => { setScamInput(e.target.value); setScamExplanation(''); }} />
            <div className="rounded-xl bg-slate-100 p-3"><p className="font-black">{scam.result}</p><p className="text-sm">{scam.message}</p></div>
            <button onClick={explainScam} className="min-h-12 w-full rounded-xl border-2 border-slate-900 font-black">Explain this result with OpenAI</button>
            {scamExplanation && <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold">{scamExplanation}</p>}
          </ReviewSection>

          <label className="flex gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm"><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} /> I reviewed this mock report and approve it.</label>
          <button disabled={!approved} onClick={submitMockReport} className="min-h-14 w-full rounded-2xl bg-green-700 font-black text-white disabled:bg-slate-400">Submit mock report</button>
          <button onClick={() => setStage('triage')} className="w-full p-3 font-bold">Change route</button>
        </section>
      )}

      {stage === 'status' && (
        <section className="space-y-4" aria-labelledby="status-heading">
          <div><p className="text-sm font-black uppercase tracking-widest text-blue-700">Status check</p><h2 id="status-heading" className="text-2xl font-black">Understand what your status means.</h2></div>
          <ReviewSection title="Mock acknowledgment number"><p className="font-mono text-lg font-black">FR-DEMO-2026-0812</p><p className="text-sm">This is a synthetic reference, not a real complaint number.</p></ReviewSection>
          <p className="rounded-2xl bg-blue-50 p-4 font-bold">Typical cases like this take {range.min}–{range.max} days. You are viewing simulated day 6.</p>
          {statuses.map((status) => <ReviewSection key={status.state} title={`${status.title} · day ${status.simulatedDay}`}><p><strong>What it means:</strong> {status.meaning}</p><p><strong>What happens next:</strong> {status.next}</p><p><strong>Your action:</strong> {status.citizenAction}</p></ReviewSection>)}
          <button onClick={() => setStage('triage')} className="w-full p-3 font-bold">Back to triage</button>
        </section>
      )}

      {stage === 'submitted' && (
        <section className="space-y-4" aria-labelledby="submitted-heading">
          <div className="rounded-3xl bg-green-50 p-5"><p className="text-sm font-black uppercase tracking-widest text-green-800">Mock report created</p><h2 id="submitted-heading" className="mt-1 text-3xl font-black">You have a reference.</h2><p className="mt-2">Your prototype report is saved only in this simulated journey.</p></div>
          <ReviewSection title="Acknowledgment number"><p className="font-mono text-xl font-black">{ack}</p><p className="text-sm">Synthetic demo reference — not a real government complaint number.</p></ReviewSection>
          <button onClick={() => setStage('status')} className="min-h-14 w-full rounded-2xl bg-blue-700 font-black text-white">View simulated status</button>
          <button onClick={() => setStage('triage')} className="w-full p-3 font-bold">Start another demo journey</button>
        </section>
      )}
    </main>
  );
}
