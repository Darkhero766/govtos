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
      const payload = {
        story: safeText(body.story),
        amount: safeText(body.amount),
        approximateTime: safeText(body.approximateTime),
        platform: safeText(body.platform),
      };
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
