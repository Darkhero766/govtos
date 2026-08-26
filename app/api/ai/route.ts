import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { Journey } from '../../../types/models';

export const runtime = 'nodejs';
const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned) as T;
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 4000) : '';
}

function localChat(messages: ChatMessage[]): { reply: string; journey: Journey } {
  const value = messages.filter((m: ChatMessage) => m.role === 'user').at(-1)?.content?.trim() || '';
  const t = value.toLowerCase();
  if (/^(hi|hey|hello|hii|namaste|yo|good morning|good evening)\b/.test(t)) return { reply: 'Hey! 👋 I’m here with you. Tell me what happened online, in your own words. You don’t need to know the right category.', journey: 'standard' };
  if (/money|paid|payment|upi|bank|transfer|otp|scam|fraud/.test(t)) return { reply: 'I can help. If money was sent or an OTP was shared, tell me what happened without sharing the OTP itself. If money is moving right now, call 1930 and your bank first.', journey: 'urgent' };
  if (/threat|blackmail|bully|bullying|harass|stalk|photo|image|instagram|whatsapp/.test(t)) return { reply: 'I’m sorry you’re dealing with that. First, don’t delete the messages. Save screenshots and the profile/message link, and tell a trusted adult if you can. What happened most recently?', journey: 'standard' };
  if (/password|pin|cvv|aadhaar|pan/.test(t)) return { reply: 'Please don’t send that information here. I can still help without seeing it. Tell me what someone asked you to do and which app or website it happened on.', journey: 'standard' };
  return { reply: 'That’s okay — you don’t have to explain it perfectly. What happened, and what are you most worried about right now?', journey: 'standard' };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const operation = body?.operation;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && operation === 'chat') return NextResponse.json(localChat(Array.isArray(body.messages) ? body.messages : []));
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 503 });
  const client = new OpenAI({ apiKey });
  try {
    if (operation === 'chat') {
      const messages: ChatMessage[] = Array.isArray(body.messages)
        ? body.messages.slice(-12).map((m: { role?: string; content?: unknown }): ChatMessage => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: safeText(m.content),
          }))
        : [];
      const transcript = messages.map((m: ChatMessage) => `${m.role === 'assistant' ? 'First Response' : 'Person'}: ${m.content}`).join('\n');
      const response = await client.responses.create({ model, store: false, input: `You are First Response, a calm, kind cyber-safety guide for children, teenagers, parents, and people who are scared or confused online. Talk like a patient trusted adult, not a lawyer or police form. Never blame the person. Never ask for Aadhaar, PAN, OTP, passwords, CVV, bank PIN, exact home address, or intimate images. Do not ask a child to secretly meet anyone or confront a suspected offender. If there is immediate physical danger, tell them to move to a trusted adult/safe place and contact local emergency services. For financial fraud, prioritize calling 1930 immediately and contacting the bank. For bullying, threats, blackmail, stalking, impersonation or intimate-image abuse, prioritize preserving evidence, telling a trusted adult, using platform reporting/blocking when appropriate, and preparing an official cybercrime report. Explain one or two simple next steps at a time. Ask gentle clarifying questions when needed. Do not claim that you filed a police complaint or contacted authorities. Return JSON only with keys reply and journey, where journey is exactly urgent, standard, or status. Conversation:\n${transcript}` });
      try {
        const result = parseJson<{ reply: string; journey: Journey }>(response.output_text);
        if (!['urgent', 'standard', 'status'].includes(result.journey)) result.journey = 'standard';
        return NextResponse.json(result);
      } catch {
        return NextResponse.json(localChat(messages));
      }
    }
    if (operation === 'triage') {
      const response = await client.responses.create({ model, store: false, input: `Classify this cybercrime citizen message into exactly one journey. urgent = money is being taken or a financial transfer is happening now; status = an existing complaint/status request; standard = everything else. Never invent facts. Return JSON only with keys journey and reason. Message: ${safeText(body.story)}` });
      const result = parseJson<{ journey: Journey; reason: string }>(response.output_text);
      if (!['urgent', 'standard', 'status'].includes(result.journey)) throw new Error('Invalid AI journey');
      return NextResponse.json(result);
    }
    if (operation === 'draft') {
      const payload = { story: safeText(body.story), amount: safeText(body.amount), approximateTime: safeText(body.approximateTime), platform: safeText(body.platform) };
      const response = await client.responses.create({ model, store: false, input: `Draft a cybercrime complaint summary from only stated facts. Missing facts must be "We don't know this yet." Never invent a transaction ID, suspect identity, bank, time, amount, or evidence. Return JSON only with keys summary, suspected, financialLoss, amount, approximateIncidentType, possibleEvidence, missing. Data: ${JSON.stringify(payload)}` });
      return NextResponse.json(parseJson(response.output_text));
    }
    if (operation === 'scamReason') {
      const payload = { query: safeText(body.query), result: safeText(body.result), signal: safeText(body.signal) };
      const response = await client.responses.create({ model, store: false, input: `Explain a deterministic scam-signature result in plain language. The deterministic matcher is authoritative: do not change MATCH, NOT FOUND, or INCONCLUSIVE. If MATCH, explain only the supplied signal. If NOT FOUND, explicitly say it was not found in the demonstration data and does not mean safe. If INCONCLUSIVE, explain that more valid input is needed. Return JSON only: {"explanation":"..."}. Data: ${JSON.stringify(payload)}` });
      return NextResponse.json(parseJson<{ explanation: string }>(response.output_text));
    }
    return NextResponse.json({ error: 'Unknown AI operation.' }, { status: 400 });
  } catch (error) {
    console.error('AI route error', error);
    if (operation === 'chat') return NextResponse.json(localChat(Array.isArray(body.messages) ? body.messages : []));
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 });
  }
}
