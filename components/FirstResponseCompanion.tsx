'use client';

import { useEffect, useRef, useState } from 'react';
import { aiChat } from '../ai/openaiClient';

type Role = 'victim' | 'child' | 'parent' | 'helper';
type Msg = { role: 'user' | 'assistant'; content: string };

type Recognition = {
  start: () => void;
  stop: () => void;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

const starter: Record<Role, string> = {
  victim: 'I’m here with you. Tell me what happened — you do not need to know the right category.',
  child: 'You are not in trouble. Tell me what happened in your own words, and we’ll take one safe step at a time.',
  parent: 'You can describe what is happening to your child or family member. I’ll help you support them without blaming or overwhelming them.',
  helper: 'Tell me what happened to the person you are helping. I’ll keep the advice focused on their safety and the next useful action.',
};

const quick = [
  ['money', 'Money was sent / taken'],
  ['threat', 'Someone is threatening me'],
  ['account', 'My account was hacked'],
  ['bully', 'I’m being bullied'],
];

function classify(text: string) {
  const t = text.toLowerCase();
  if (/money|paid|payment|upi|bank|transfer|fraud|scam|otp/.test(t)) return 'urgent';
  return 'standard';
}

export default function FirstResponseCompanion() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>('victim');
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: starter.victim }]);
  const [risk, setRisk] = useState<'urgent' | 'standard' | null>(null);
  const [evidence, setEvidence] = useState<string[]>([]);
  const recognition = useRef<Recognition | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const Speech = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!Speech) return;
    const r = new Speech();
    r.interimResults = true;
    r.continuous = false;
    r.lang = language;
    r.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (last?.[0]?.transcript) setText(last[0].transcript);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognition.current = r;
    return () => { try { r.stop(); } catch {} recognition.current = null; };
  }, [open, language]);

  function changeRole(next: Role) {
    setRole(next);
    setMessages([{ role: 'assistant', content: starter[next] }]);
    setRisk(null);
  }

  function speak() {
    if (!recognition.current) return;
    if (listening) { recognition.current.stop(); setListening(false); return; }
    recognition.current.lang = language;
    setListening(true);
    try { recognition.current.start(); } catch { setListening(false); }
  }

  function addEvidence(files: FileList | null) {
    if (!files) return;
    setEvidence(prev => [...prev, ...Array.from(files).slice(0, 5).map(f => f.name)]);
  }

  async function send(value = text) {
    const clean = value.trim();
    if (!clean) return;
    const next = [...messages, { role: 'user' as const, content: clean }];
    setMessages(next); setText('');
    const detected = classify(clean);
    if (detected === 'urgent') setRisk('urgent');
    try {
      const r = await aiChat(next);
      setMessages([...next, { role: 'assistant', content: r.reply }]);
      if (r.journey === 'urgent') setRisk('urgent');
    } catch {
      const t = clean.toLowerCase();
      const fallback = /money|upi|bank|transfer|payment|fraud|scam/.test(t)
        ? 'If money has just moved, stop here and act first: call 1930 and contact your bank through its official app or number. Do not share another OTP, PIN or password. Keep the transaction screenshot and details.'
        : /blackmail|nude|intimate|threat|bully|harass/.test(t)
          ? 'You are not in trouble. Don’t pay or negotiate. Keep the chat and screenshots, save the profile/message link, and tell someone you trust. If you are under 18, involve a trusted adult now.'
          : 'You do not have to explain it perfectly. Tell me what happened, which app or website was involved, and what you are most worried will happen next.';
      setMessages([...next, { role: 'assistant', content: fallback }]);
    }
  }

  return <>
    <button className="fr-companion-fab" onClick={() => setOpen(true)} aria-label="Open First Response help"><span>✦</span><b>Need help?</b></button>
    {open && <div className="fr-companion-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="fr-companion" role="dialog" aria-modal="true" aria-label="First Response safety companion">
        <header className="fr-companion-header">
          <div className="fr-companion-title"><span className="fr-spark">✦</span><div><strong>Talk to First Response</strong><small>Your calm next-step guide</small></div></div>
          <div className="fr-header-actions"><button onClick={() => setMessages([{ role: 'assistant', content: starter[role] }])}>Clear</button><button className="fr-close" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
        </header>
        <div className="fr-companion-body">
          <aside className="fr-companion-side">
            <div className="fr-side-copy"><span className="fr-side-kicker">FIRST 10 MINUTES</span><h2>Let’s make the next move clear.</h2><p>If this is happening right now, you don’t have to figure everything out before asking for help.</p></div>
            <div className="fr-role"><span>Who are you helping?</span><div>{(['victim','child','parent','helper'] as Role[]).map(r => <button key={r} className={role === r ? 'active' : ''} onClick={() => changeRole(r)}>{r === 'victim' ? 'Me' : r === 'child' ? 'My child' : r === 'parent' ? 'My parent' : 'Someone else'}</button>)}</div></div>
            <div className="fr-emergency"><b>Money moving?</b><strong>Call 1930 first.</strong><a href="tel:1930">Call 1930 →</a></div>
            <div className="fr-evidence-mini"><div><b>Evidence Vault</b><span>{evidence.length ? `${evidence.length} item${evidence.length > 1 ? 's' : ''} saved here` : 'Keep screenshots together'}</span></div><button onClick={() => fileRef.current?.click()}>+ Add proof</button><input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.webp" multiple hidden onChange={e => addEvidence(e.target.files)} /></div>
          </aside>
          <main className="fr-chat">
            <div className="fr-chat-intro"><div><span>PRIVATE BY DESIGN</span><b>Tell me. I’ll help you decide what to do next.</b></div><button onClick={() => setLanguage(language === 'en-IN' ? 'hi-IN' : 'en-IN')}>{language === 'en-IN' ? 'हिंदी' : 'English'}</button></div>
            {risk === 'urgent' && <div className="fr-golden-hour"><strong>🚨 Act now</strong><span>Financial fraud detected. Call 1930 and your bank before continuing.</span><a href="tel:1930">Call 1930</a></div>}
            <div className="fr-quick">{quick.map(([id, label]) => <button key={id} onClick={() => send(label)}>{label}<span>→</span></button>)}</div>
            <div className="fr-messages">{messages.map((m, i) => <div key={`${m.role}-${i}`} className={`fr-msg ${m.role}`}><span>{m.role === 'assistant' ? '✦' : 'You'}</span><p>{m.content}</p></div>)}</div>
            <div className="fr-composer"><button className={listening ? 'listening' : ''} onClick={speak} aria-label="Speak message">{listening ? '●' : '🎙'}</button><textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={language === 'hi-IN' ? 'बताइए क्या हुआ…' : 'Tell me what happened…'} /><button onClick={() => send()} disabled={!text.trim()}>→</button></div>
            <small className="fr-privacy">Never send passwords, OTPs, PINs, CVV or private intimate images here.</small>
          </main>
        </div>
      </section>
    </div>}
  </>;
}
