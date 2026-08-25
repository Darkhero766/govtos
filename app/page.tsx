'use client';

import { useMemo, useState } from 'react';
import { extractIncidentDraft } from '../ai/extractIncidentDraft';
import { PrototypeBanner } from '../components/PrototypeBanner';
import { LargeActionButton } from '../components/LargeActionButton';
import { ReviewSection } from '../components/ReviewSection';
import { syntheticHistoricalCases } from '../data/syntheticCases';
import { createEvidence } from '../evidence/evidenceSignals';
import { scamCheck } from '../scam-check/scamCheck';
import { buildStatusTimeline } from '../status/statusMachine';
import { classifyWithRules, overrideTriage, type TriageResult } from '../triage/triageRules';
import { buildTimeline, editTimelineEvent } from '../timeline/timelineBuilder';
import type { EvidenceItem, EvidenceType, TimelineEvent } from '../types/models';

const evidenceTypes: EvidenceType[] = ['transaction_screenshot', 'sms', 'phone', 'upi', 'url', 'chat_screenshot', 'email', 'notes'];

export default function Home() {
  const [story, setStory] = useState('A guy called saying he was from my bank and I transferred 18,500.');
  const [triage, setTriage] = useState<TriageResult>(() => classifyWithRules(story));
  const [stage, setStage] = useState<'start' | 'understand' | 'evidence' | 'review' | 'status'>('start');
  const [amount, setAmount] = useState('₹18,500');
  const [time, setTime] = useState("We don't know this yet.");
  const [platform, setPlatform] = useState("We don't know this yet.");
  const [whatHappened, setWhatHappened] = useState(story);
  const [evidenceText, setEvidenceText] = useState('SMS: INR 18,500 debited after call from +919999999999');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('sms');
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [approved, setApproved] = useState(false);
  const [scamInput, setScamInput] = useState('refund-help@upi');
  const draft = useMemo(() => extractIncidentDraft(whatHappened), [whatHappened]);
  const statuses = useMemo(() => buildStatusTimeline(syntheticHistoricalCases), []);
  const scam = useMemo(() => scamCheck(scamInput), [scamInput]);

  function understand() { const result = classifyWithRules(story); setTriage(result); setWhatHappened(story); setStage('understand'); }
  function addEvidence() { const item = createEvidence(evidenceType, evidenceText); const next = [...evidence, item]; setEvidence(next); setTimeline(buildTimeline(whatHappened, next)); }

  return <main className="mx-auto min-h-screen max-w-md space-y-4 bg-slate-50 p-4">
    <PrototypeBanner />
    <header className="space-y-2"><p className="text-sm font-bold uppercase tracking-wide text-blue-700">First Response</p><h1 className="text-3xl font-black leading-tight text-slate-950">When cyber fraud happens, start with help — not forms.</h1><p className="text-slate-700">Triage → Protect → Preserve → Report → Track</p></header>

    {stage === 'start' && <section className="space-y-3">
      <h2 className="text-xl font-black">What happened?</h2>
      <LargeActionButton tone="danger" onClick={() => setTriage(overrideTriage('urgent'))}>🚨 Something is happening right now<br/><span className="text-base font-medium">Money is being taken from my account.</span></LargeActionButton>
      <LargeActionButton onClick={() => setTriage(overrideTriage('standard'))}>⚠️ Something happened<br/><span className="text-base font-medium">I lost money, received a suspicious message, or was targeted.</span></LargeActionButton>
      <LargeActionButton onClick={() => setTriage(overrideTriage('status'))}>📋 I already reported something<br/><span className="text-base font-medium">I want to understand my complaint.</span></LargeActionButton>
      <label className="block font-bold">Tell us what happened<textarea className="mt-2 min-h-32 w-full rounded-2xl border p-3" value={story} onChange={(e) => setStory(e.target.value)} /></label>
      <div className="rounded-2xl bg-white p-3"><p className="font-bold">We understood this as: {triage.label}</p><button className="mt-2 rounded-xl border px-4 py-3 font-bold" onClick={understand}>Continue / Change</button></div>
    </section>}

    {stage === 'understand' && <section className="space-y-3">
      {triage.journey === 'urgent' && <div className="rounded-3xl border-4 border-red-700 bg-red-50 p-4"><p className="text-sm font-black text-red-800">ACT NOW</p><h2 className="text-2xl font-black">Call 1930</h2><p>This is a mock interaction. This prototype does not place calls and cannot freeze accounts.</p><button className="mt-3 min-h-14 w-full rounded-2xl bg-red-700 px-4 text-lg font-black text-white">Simulate call prompt</button></div>}
      <ReviewSection title="What we understood"><ul className="list-inside list-disc"><li>{draft.suspected}</li><li>financial loss: {draft.financialLoss}</li><li>amount: {draft.amount}</li><li>incident type: {draft.approximateIncidentType}</li><li>possible evidence: {draft.possibleEvidence.join(', ')}</li></ul><p className="font-bold">AI must not invent facts. Missing details stay as “We don't know this yet.”</p></ReviewSection>
      <ReviewSection title={triage.journey === 'urgent' ? 'Minimal questions while you contact the right channel' : 'Tell the story first, then structure it'}>
        <input aria-label="amount" className="w-full rounded-xl border p-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input aria-label="approximate time" className="w-full rounded-xl border p-3" value={time} onChange={(e) => setTime(e.target.value)} />
        <input aria-label="bank or payment platform" className="w-full rounded-xl border p-3" value={platform} onChange={(e) => setPlatform(e.target.value)} />
        <textarea aria-label="what happened" className="min-h-24 w-full rounded-xl border p-3" value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)} />
      </ReviewSection>
      <div className="grid grid-cols-2 gap-3"><button className="rounded-2xl border p-4 font-black" onClick={() => setStage('start')}>Edit</button><button className="rounded-2xl bg-blue-700 p-4 font-black text-white" onClick={() => setStage('evidence')}>Yes, continue</button></div>
    </section>}

    {stage === 'evidence' && <section className="space-y-3"><h2 className="text-xl font-black">Evidence locker</h2><p className="text-slate-700">Use mock/demo evidence only. Original text is preserved; nothing is silently deleted.</p><select className="w-full rounded-xl border p-3" value={evidenceType} onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}>{evidenceTypes.map((type) => <option key={type}>{type}</option>)}</select><textarea className="min-h-28 w-full rounded-xl border p-3" value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} /><button className="min-h-14 w-full rounded-2xl bg-blue-700 font-black text-white" onClick={addEvidence}>Add mock evidence</button>{evidence.map((item) => <ReviewSection key={item.id} title={item.label}><p>{item.content}</p><p className="text-sm">Signals: {Object.entries(item.signals).map(([k,v]) => `${k}: ${v}`).join(', ') || "We don't know this yet."}</p></ReviewSection>)}<ReviewSection title="Incident timeline">{timeline.map((event) => <div key={event.id} className="grid grid-cols-3 gap-2"><input className="rounded-lg border p-2" value={event.time} onChange={(e) => setTimeline(editTimelineEvent(timeline, event.id, { time: e.target.value }))}/><input className="col-span-2 rounded-lg border p-2" value={event.description} onChange={(e) => setTimeline(editTimelineEvent(timeline, event.id, { description: e.target.value }))}/></div>)}</ReviewSection><button className="min-h-14 w-full rounded-2xl bg-blue-700 font-black text-white" onClick={() => setStage('review')}>Review evidence pack</button></section>}

    {stage === 'review' && <section className="space-y-3"><h2 className="text-xl font-black">Review before reporting</h2><ReviewSection title="Incident"><p>{whatHappened}</p></ReviewSection><ReviewSection title="Financial information"><p>Amount: {amount}</p><p>Approximate time: {time}</p><p>Bank/payment platform: {platform}</p></ReviewSection><ReviewSection title="Identifiers"><p>{evidence.flatMap((e) => Object.entries(e.signals)).filter(([k]) => ['phone','upi','url'].includes(k)).map(([k,v]) => `${k}: ${v}`).join(', ') || "We don't know this yet."}</p></ReviewSection><ReviewSection title="Communications">{evidence.map((e) => <p key={e.id}>{e.label}: {e.content}</p>)}</ReviewSection><ReviewSection title="Timeline">{timeline.map((e) => <p key={e.id}>{e.time} — {e.description}</p>)}</ReviewSection><label className="flex gap-3 rounded-2xl bg-white p-4 font-bold"><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} /> I reviewed and approve this mock report.</label><button disabled={!approved} className="min-h-14 w-full rounded-2xl bg-green-700 font-black text-white disabled:bg-slate-400" onClick={() => setStage('status')}>Create mock report</button></section>}

    {stage === 'status' && <section className="space-y-3"><h2 className="text-xl font-black">Simulated status tracker</h2><p className="text-sm font-bold">This prototype has no access to real complaint status.</p>{statuses.map((s) => <ReviewSection key={s.state} title={`${s.title} — simulated day ${s.simulatedDay}`}><p><strong>What this means:</strong> {s.meaning}</p><p><strong>What happens next:</strong> {s.next}</p><p><strong>Do I need to do anything?</strong> {s.citizenAction}</p></ReviewSection>)}<ReviewSection title="Secondary mock scam check"><input className="w-full rounded-xl border p-3" value={scamInput} onChange={(e) => setScamInput(e.target.value)} /><p className="font-black">{scam.result}</p><p>{scam.message}</p></ReviewSection></section>}
  </main>;
}
