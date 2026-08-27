'use client';

import { useState } from 'react';
import Link from 'next/link';
import { aiChat } from '../../ai/openaiClient';
import type { Journey } from '../../types/models';
import './ai.css';

type Message = { role: 'user' | 'assistant'; content: string };

const welcome: Message = {
  role: 'assistant',
  content: 'Hi, I’m First Response. You can tell me what happened in your own words — even if you are scared, confused, or don’t know what to call it. We’ll take one small step at a time.',
};

function fallback(text: string): string {
  const t = text.toLowerCase();
  if (/money|payment|upi|bank|transfer|fraud|scam/.test(t)) return 'If money is moving right now, please call 1930 and your bank immediately. Don’t share an OTP, PIN or password with anyone. I can help you work out what to do next.';
  if (/blackmail|threat|bully|bullying|harass|stalk|private photo|intimate/.test(t)) return 'I’m sorry this is happening. Don’t pay or threaten them back. Keep the messages and take screenshots. If you’re a child or teenager, tell a trusted adult who can stay with you. What happened most recently?';
  if (/password|otp|pin|cvv|aadhaar|pan/.test(t)) return 'Please don’t send that secret information here. Tell me what someone asked you to do instead, and I’ll help you safely.';
  return 'That’s okay — you don’t have to explain it perfectly. What happened, and what are you most worried about right now?';
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(value = text) {
    const clean = value.trim();
    if (!clean || loading) return;
    const next = [...messages, { role: 'user' as const, content: clean }];
    setMessages(next);
    setText('');
    setLoading(true);
    try {
      const result = await aiChat(next);
      setMessages([...next, { role: 'assistant', content: result.reply }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: fallback(clean) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ai-page">
      <header className="ai-topbar">
        <Link href="/" className="ai-brand"><span>FR</span><strong>First Response</strong><small>Cyber help, made understandable</small></Link>
        <Link href="/" className="ai-back">← Back to home</Link>
      </header>

      <section className="ai-layout">
        <aside className="ai-side">
          <div className="ai-side-mark">✦</div>
          <p className="ai-eyebrow">FIRST RESPONSE AI</p>
          <h1>Not sure what to do?<br /><em>Start by talking.</em></h1>
          <p>I’ll help you understand what happened, keep useful evidence, and choose a safer next step.</p>
          <div className="ai-trust-list">
            <span>✓ Simple language</span>
            <span>✓ Child-friendly guidance</span>
            <span>✓ Never ask for OTPs or passwords</span>
            <span>✓ One step at a time</span>
          </div>
          <div className="ai-emergency"><b>Financial fraud happening now?</b><strong>Call 1930</strong><span>Then contact your bank.</span></div>
        </aside>

        <section className="ai-chat-panel" aria-label="First Response AI conversation">
          <div className="ai-chat-head"><div><b>Talk to First Response</b><span>Here to help, not judge.</span></div><span className="ai-online"><i /> Online</span></div>
          <div className="ai-messages-full">
            {messages.map((m, i) => <div key={`${m.role}-${i}`} className={`ai-bubble ${m.role}`}>{m.content}</div>)}
            {loading && <div className="ai-bubble assistant ai-typing"><i /><i /><i /></div>}
          </div>
          <div className="ai-suggestions">
            {['Someone is threatening me', 'I think I got scammed', 'I’m being bullied online', 'I don’t know what to do'].map(prompt => <button key={prompt} onClick={() => send(prompt)} disabled={loading}>{prompt}</button>)}
          </div>
          <div className="ai-compose-full">
            <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Tell me what happened…" aria-label="Message First Response" />
            <button onClick={() => send()} disabled={loading || !text.trim()} aria-label="Send message">→</button>
          </div>
          <p className="ai-privacy">For your safety, never share passwords, OTPs, PINs, CVV numbers, or private intimate images here.</p>
        </section>
      </section>
    </main>
  );
}
