'use client';

import { useMemo, useState } from 'react';
import { aiDraft, aiScamReason, aiTriage } from '../ai/openaiClient';
import { extractIncidentDraft } from '../ai/extractIncidentDraft';
import { ReviewSection } from '../components/ReviewSection';
import { syntheticHistoricalCases } from '../data/syntheticCases';
import { scamCheck } from '../scam-check/scamCheck';
import { buildStatusTimeline, calculateTypicalRange } from '../status/statusMachine';
import { classifyWithRules, overrideTriage, type TriageResult } from '../triage/triageRules';
import { checkIncidentCharacters } from '../validation/characterGuard';
import type { Journey } from '../types/models';

const demoStory = 'A caller pretended to be from my bank and I transferred ₹18,500.';

function ShieldIcon({ small = false }: { small?: boolean }) {
  return (
    <div className={`${small ? 'h-10 w-10' : 'h-14 w-14'} hero-gradient flex shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-blue-500/20`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className={`${small ? 'h-5 w-5' : 'h-7 w-7'} text-white`} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" />
        <path d="m10 12 1.5 1.5L15 10" />
      </svg>
    </div>
  );
}

function Arrow() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>;
}

function ChoiceIcon({ type }: { type: 'urgent' | 'report' | 'status' }) {
  const icon = type === 'urgent' ? <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /> : type === 'report' ? <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></> : <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>;
  return <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${type === 'urgent' ? 'bg-red-50 text-red-600' : type === 'report' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'}`}><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg></div>;
}

function FooterTrust() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      {[
        ['🔒', 'Private', 'Synthetic demo data'],
        ['⚡', 'Act fast', 'Clear next steps'],
        ['◉', 'Track', 'Understand progress'],
      ].map(([icon, title, text]) => <div key={title} className="text-center"><div className="text-xl">{icon}</div><p className="mt-1 text-xs font-black text-slate-900">{title}</p><p className="mt-0.5 text-[10px] leading-tight text-slate-500">{text}</p></div>)}
    </div>
  );
}

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

  const backToTriage = <button onClick={() => setStage('triage')} className="w-full rounded-2xl py-3 text-sm font-bold text-slate-500 hover:text-slate-900">← Back to triage</button>;

  return (
    <main className="app-shell min-h-screen px-4 py-5 text-slate-950">
      <div className="mx-auto max-w-xl">
        <header className="glass sticky top-3 z-20 mb-7 flex items-center justify-between rounded-3xl border border-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
          <div className="flex items-center gap-3"><ShieldIcon small /><div><p className="text-base font-black tracking-tight">FIRST RESPONSE</p><p className="text-[11px] font-semibold text-slate-500">Triage · Act · Report · Track</p></div></div>
          <button aria-label="Menu" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><span className="text-xl">☰</span></button>
        </header>

        {stage === 'triage' && <>
          <section className="relative overflow-hidden rounded-[2rem] border border-white bg-white px-6 pb-7 pt-7 shadow-xl shadow-slate-200/60">
            <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 blur-2xl" />
            <div className="relative">
              <p className="mb-3 text-sm font-black uppercase tracking-[.2em] text-blue-600">Your first step</p>
              <h1 className="max-w-lg text-[2.45rem] font-black leading-[1.02] tracking-[-.045em] sm:text-5xl">Start with what happened,<br /><span className="gradient-text">not a legal category.</span></h1>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-600">We’ll guide you to the right action — fast, then help you report and understand what happens next.</p>
            </div>
          </section>

          <section className="mt-6" aria-labelledby="triage-heading">
            <div className="mb-3 flex items-center gap-3"><span className="h-6 w-1 rounded-full bg-blue-600" /><h2 id="triage-heading" className="text-xl font-black tracking-tight">What do you need right now?</h2></div>
            <div className="space-y-3">
              <button onClick={() => chooseJourney('urgent')} className="choice-card flex min-h-[82px] w-full items-center gap-4 rounded-3xl border border-red-100 bg-white px-4 text-left shadow-sm hover:border-red-200"><ChoiceIcon type="urgent" /><span className="flex-1"><span className="block text-base font-black text-red-600">Money is being taken</span><span className="block text-sm font-medium text-slate-600">from my account right now.</span></span><Arrow /></button>
              <button onClick={() => chooseJourney('standard')} className="choice-card flex min-h-[82px] w-full items-center gap-4 rounded-3xl border border-blue-100 bg-white px-4 text-left shadow-sm hover:border-blue-200"><ChoiceIcon type="report" /><span className="flex-1"><span className="block text-base font-black text-blue-600">Something happened</span><span className="block text-sm font-medium text-slate-600">and I want to report it.</span></span><Arrow /></button>
              <button onClick={() => chooseJourney('status')} className="choice-card flex min-h-[82px] w-full items-center gap-4 rounded-3xl border border-violet-100 bg-white px-4 text-left shadow-sm hover:border-violet-200"><ChoiceIcon type="status" /><span className="flex-1"><span className="block text-base font-black text-violet-600">I want to check</span><span className="block text-sm font-medium text-slate-600">a complaint I already filed.</span></span><Arrow /></button>
            </div>
          </section>

          <section className="mt-7 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white">✦</div><div><h2 className="text-lg font-black">Tell us in your own words</h2><p className="text-xs text-slate-500">No categories. Just describe what happened.</p></div></div>
            <textarea aria-label="Describe what happened" className="min-h-32 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 p-4 text-base leading-6 outline-none transition focus:border-blue-500 focus:bg-white" value={story} onChange={(e) => setStory(e.target.value)} />
            <div className="mt-2 flex justify-end text-xs font-semibold text-slate-400">{story.length}/500</div>
            <button disabled={triageLoading || !story.trim()} onClick={continueFromFreeText} className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 font-black text-white shadow-lg shadow-blue-500/20 transition hover:brightness-105 disabled:opacity-50">✦ {triageLoading ? 'Understanding…' : 'Continue & choose best path'}</button>
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-black">Chosen route: <span className="capitalize">{triage.journey}</span></p><p className="mt-1 text-slate-600">{triageReason}</p></div>
            {aiError && <p role="status" className="mt-2 text-sm font-bold text-amber-800">{aiError}</p>}
          </section>
          <div className="mt-5"><FooterTrust /></div>
        </>}

        {stage === 'urgent' && <section className="space-y-4">
          <div className="hero-gradient overflow-hidden rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20"><p className="text-xs font-black uppercase tracking-[.2em] text-blue-100">First response · urgent</p><h1 className="mt-2 text-4xl font-black tracking-tight">Act first.<br />Report second.</h1><p className="mt-3 max-w-md text-sm leading-6 text-blue-50">If money is moving right now, getting help quickly matters more than finishing a form.</p><button className="mt-5 min-h-16 w-full rounded-2xl bg-white px-4 text-lg font-black text-blue-700 shadow-lg">☎ Call 1930 now</button><p className="mt-2 text-center text-[11px] font-semibold text-blue-100">Mock interaction — this prototype does not place calls or freeze accounts.</p></div>
          <ReviewSection title="Build your report while you act"><p className="text-sm text-slate-600">Nothing is treated as confirmed until you review it.</p><textarea aria-label="Incident description" className="mt-3 min-h-28 w-full rounded-2xl border border-slate-300 p-3" value={description} onChange={(e) => setDescription(e.target.value)} /><div className="mt-3 grid gap-2"><input aria-label="Amount" className="rounded-2xl border border-slate-300 p-3" value={amount} onChange={(e) => setAmount(e.target.value)} /><input aria-label="Approximate time" className="rounded-2xl border border-slate-300 p-3" value={approximateTime} onChange={(e) => setApproximateTime(e.target.value)} /><input aria-label="Bank or payment platform" className="rounded-2xl border border-slate-300 p-3" value={platform} onChange={(e) => setPlatform(e.target.value)} /></div><button onClick={generateDraft} disabled={aiLoading} className="mt-3 min-h-14 w-full rounded-2xl bg-slate-950 font-black text-white disabled:opacity-50">{aiLoading ? 'Drafting with OpenAI…' : '✦ Draft with OpenAI'}</button>{draftSummary && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-950">{draftSummary}</p>}<ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700"><li>Amount: {draft.amount}</li><li>Possible incident: {draft.approximateIncidentType}</li><li>Possible evidence: {draft.possibleEvidence.join(', ')}</li><li>Missing: {draft.missing.join(', ')}</li></ul></ReviewSection><button onClick={submitMockReport} className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-black text-white">Create mock report →</button>{backToTriage}</section>}

        {stage === 'standard' && <section className="space-y-4"><div className="rounded-[2rem] border border-white bg-white p-6 shadow-xl shadow-slate-200/60"><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Calm reporting</p><h1 className="mt-2 text-3xl font-black tracking-tight">Tell the story first.<br /><span className="gradient-text">We’ll structure it.</span></h1></div><ReviewSection title="Incident details"><textarea aria-label="Incident description" className="min-h-36 w-full rounded-2xl border border-slate-300 p-3" value={description} onChange={(e) => setDescription(e.target.value)} />{characterGuard.blocked && <div role="alert" className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950"><strong>Character warning:</strong> {characterGuard.message}</div>}<p className="mt-2 text-xs text-slate-500">Your original text is preserved in this prototype; nothing is silently deleted.</p><div className="mt-3 grid gap-2"><input aria-label="Amount" className="rounded-2xl border border-slate-300 p-3" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Approximate amount" /><input aria-label="Approximate time" className="rounded-2xl border border-slate-300 p-3" value={approximateTime} onChange={(e) => setApproximateTime(e.target.value)} placeholder="Approximate time" /><input aria-label="Bank or payment platform" className="rounded-2xl border border-slate-300 p-3" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Bank or payment platform" /></div></ReviewSection><ReviewSection title="Optional scam check"><p className="text-sm text-slate-600">Checks one URL, UPI ID or phone number against our synthetic demonstration data. “Not found” never means safe.</p><input aria-label="URL, UPI ID or phone" className="mt-3 w-full rounded-2xl border border-slate-300 p-3" value={scamInput} onChange={(e) => { setScamInput(e.target.value); setScamExplanation(''); }} /><div className="mt-3 rounded-2xl bg-slate-50 p-4"><p className="font-black">{scam.result}</p><p className="mt-1 text-sm text-slate-600">{scam.message}</p></div><button onClick={explainScam} className="mt-3 min-h-12 w-full rounded-2xl border-2 border-slate-900 font-black">Explain result with OpenAI</button>{scamExplanation && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-semibold">{scamExplanation}</p>}</ReviewSection><label className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold shadow-sm"><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="mt-1 h-5 w-5" /> I reviewed this mock report and approve it.</label><button disabled={!approved} onClick={submitMockReport} className="min-h-14 w-full rounded-2xl bg-green-600 font-black text-white disabled:bg-slate-300">Submit mock report</button>{backToTriage}</section>}

        {stage === 'status' && <section className="space-y-4"><div className="rounded-[2rem] border border-white bg-white p-6 shadow-xl shadow-slate-200/60"><p className="text-xs font-black uppercase tracking-[.2em] text-violet-600">Status check</p><h1 className="mt-2 text-3xl font-black tracking-tight">Know what your status means.</h1><p className="mt-2 text-sm leading-6 text-slate-600">No bare labels. Each step explains what is happening and whether you need to act.</p></div><ReviewSection title="Mock acknowledgment"><p className="font-mono text-xl font-black">FR-DEMO-2026-0812</p><p className="mt-1 text-xs text-slate-500">Synthetic reference — not a real complaint number.</p></ReviewSection><p className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-950">Typical cases like this take {range.min}–{range.max} days. Simulated current day: 6.</p>{statuses.map((status) => <ReviewSection key={status.state} title={`${status.title} · day ${status.simulatedDay}`}><p><strong>What it means:</strong> {status.meaning}</p><p className="mt-2"><strong>What happens next:</strong> {status.next}</p><p className="mt-2"><strong>Your action:</strong> {status.citizenAction}</p></ReviewSection>)}{backToTriage}</section>}

        {stage === 'submitted' && <section className="space-y-4"><div className="rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-100">Mock report created</p><h1 className="mt-2 text-4xl font-black tracking-tight">You have a reference.</h1><p className="mt-2 text-sm text-emerald-50">Your prototype report exists only inside this simulated journey.</p></div><ReviewSection title="Acknowledgment number"><p className="font-mono text-xl font-black">{ack}</p><p className="mt-1 text-xs text-slate-500">Synthetic demo reference — not a real government complaint number.</p></ReviewSection><button onClick={() => setStage('status')} className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-black text-white">View simulated status →</button>{backToTriage}</section>}

        <footer className="mt-8 border-t border-slate-200 pt-5 text-center"><p className="text-xs font-bold text-slate-500">Independent hackathon prototype · Not an official government product</p><p className="mt-1 text-[11px] text-slate-400">All integrations, evidence, reports and status updates are simulated.</p></footer>
      </div>
    </main>
  );
}
