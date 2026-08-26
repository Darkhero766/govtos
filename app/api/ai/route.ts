import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { Journey } from '../../../types/models';

export const runtime = 'nodejs';

const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned) as T;
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 4000) : '';
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 503 });
  const client = new OpenAI({ apiKey });

  try {
    const body = await request.json();
    const operation = body?.operation;

    if (operation === 'chat') {
      const messages = Array.isArray(body.messages) ? body.messages.slice(-12).map((m: { role?: string; content?: unknown }) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: safeText(m.content) })) : [];
      const transcript = messages.map((m: { role: string; content: string }) => `${m.role === 'assistant' ? 'First Response' : 'Person'}: ${m.content}`).join('\n');
      const response = await client.responses.create({
        model,
        store: false,
        input: `You are First Response, a calm, kind cyber-safety guide for children, teenagers, parents, and people who are scared or confused online. Talk like a patient trusted adult, not like a lawyer or police form. Never blame the person. Never ask for Aadhaar, PAN, OTP, passwords, CVV, bank PIN, exact home address, or intimate images. Do not ask a child to secretly meet anyone or confront a suspected offender. If there is immediate physical danger, tell them to move to a trusted adult/safe place and contact local emergency services. For financial fraud, prioritize calling 1930 immediately and contacting the bank. For bullying, threats, blackmail, stalking, impersonation or intimate-image abuse, prioritize preserving evidence, telling a trusted adult, using platform reporting/blocking when appropriate, and preparing an official cybercrime report. Explain one or two simple next steps at a time. Ask gentle clarifying questions when needed. Do not claim that you filed a police complaint or contacted authorities. Return JSON only with keys reply and journey, where journey is exactly urgent, standard, or status.\nConversation:\n${transcript}`,
      });
      const result = parseJson<{ reply: string; journey: Journey }>(response.output_text);
      if (!['urgent', 'standard', 'status'].includes(result.journey)) result.journey = 'standard';
      return NextResponse.json(result);
    }

    if (operation === 'triage') {
      const story = safeText(body.story);
      const response = await client.responses.create({
        model,
        store: false,
        input: `Classify this cybercrime citizen message into exactly one journey. urgent = money is being taken or a financial transfer is happening now; status = an existing complaint/status request; standard = everything else. Never invent facts. Return JSON only with keys journey and reason. Message: ${story}`,
      });
      const result = parseJson<{ journey: Journey; reason: string }>(response.output_text);
      if (!['urgent', 'standard', 'status'].includes(result.journey)) throw new Error('Invalid AI journey');
      return NextResponse.json(result);
    }

    if (operation === 'draft') {
      const payload = { story: safeText(body.story), amount: safeText(body.amount), approximateTime: safeText(body.approximateTime), platform: safeText(body.platform) };
      const response = await client.responses.create({
        model,
        store: false,
        input: `Draft a cybercrime complaint summary from only stated facts. Missing facts must be "We don't know this yet." Never invent a transaction ID, suspect identity, bank, time, amount, or evidence. Return JSON only with keys summary, suspected, financialLoss, amount, approximateIncidentType, possibleEvidence, missing. Data: ${JSON.stringify(payload)}`,
      });
      return NextResponse.json(parseJson(response.output_text));
    }

    if (operation === 'scamReason') {
      const payload = { query: safeText(body.query), result: safeText(body.result), signal: safeText(body.signal) };
      const response = await client.responses.create({
        model,
        store: false,
        input: `Explain a deterministic scam-signature result in plain language. The deterministic matcher is authoritative: do not change MATCH, NOT FOUND, or INCONCLUSIVE. If MATCH, explain only the supplied signal. If NOT FOUND, explicitly say it was not found in the demonstration data and does not mean safe. If INCONCLUSIVE, explain that more valid input is needed. Return JSON only: {"explanation":"..."}. Data: ${JSON.stringify(payload)}`,
      });
      return NextResponse.json(parseJson<{ explanation: string }>(response.output_text));
    }

    return NextResponse.json({ error: 'Unknown AI operation.' }, { status: 400 });
  } catch (error) {
    console.error('AI route error', error);
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 });
  }
}