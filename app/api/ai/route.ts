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
function safeText(value: unknown): string { return typeof value === 'string' ? value.slice(0, 4000) : ''; }

function localChat(messages: ChatMessage[]): { reply: string; journey: Journey } {
  const value = messages.filter((m: ChatMessage) => m.role === 'user').at(-1)?.content?.trim() || '';
  const t = value.toLowerCase();
  if (/^(hi|hey|hello|hii|namaste|yo|good morning|good evening)\b/.test(t)) return { journey: 'standard', reply: 'Hey 👋 I’m First Response. You don’t need the right words here. Just tell me what happened, and I’ll help you work out the next step.' };
  if (/money|paid|payment|upi|bank|transfer|otp|scam|fraud|debit/.test(t)) return { journey: 'urgent', reply: 'If money has just been sent or is still moving, please pause here and call 1930 and your bank now. Don’t share an OTP, PIN or password with anyone. After that, come back and I’ll help you organise the details and evidence.' };
  if (/naked|nude|intimate|private video|private photo|blackmail|sextort|threat|bully|bullying|harass|stalk|instagram|whatsapp/.test(t)) return { journey: 'standard', reply: 'I’m really sorry this is happening. You are not in trouble and you don’t have to handle it alone. Don’t pay, don’t argue with them, and don’t delete the chat. Save screenshots plus the profile/message link, then tell a trusted adult or someone you trust. If you’re in immediate physical danger, get somewhere safe and contact local emergency services. If you want, tell me what they are threatening to do next.' };
  if (/password|pin|cvv|aadhaar|pan|account number/.test(t)) return { journey: 'standard', reply: 'Please keep that private — don’t send it to me. You can tell me what someone asked you to do without giving the secret itself. I can help you decide whether it looks like a scam or account takeover.' };
  if (/account hacked|hacked|locked out|login|otp/.test(t)) return { journey: 'standard', reply: 'Let’s secure the account first. Use the platform’s official recovery page, change the password from a device you trust, and turn on two-step verification if you can. Don’t share recovery codes or OTPs here. Tell me which app is affected and what changed.' };
  return { journey: 'standard', reply: 'That’s okay — you can explain it badly. I’ll help you sort it out. What happened, which app or website was involved, and what are you most worried will happen next?' };
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
      const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-12).map((m: { role?: string; content?: unknown }): ChatMessage => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: safeText(m.content) })) : [];
      const transcript = messages.map((m: ChatMessage) => `${m.role === 'assistant' ? 'First Response' : 'Person'}: ${m.content}`).join('\n');
      const response = await client.responses.create({ model, store: false, input: `You are First Response, a warm Indian cyber-safety guide for children, teenagers, parents and adults who are confused or frightened online. Your job is to make the person feel understood and give them a small, practical next step. Never sound like a government form, lawyer, call-centre script or generic AI assistant. Use natural conversational language and short paragraphs. Start by acknowledging what they said. Then give at most 3 immediate actions, prioritised. Ask exactly one useful follow-up question when more context would change the advice. Never blame the victim. Never ask for Aadhaar, PAN, OTP, passwords, CVV, bank PIN, recovery codes, exact home address or intimate images. Never ask a child to secretly meet or confront an offender. For intimate-image abuse involving a minor, say they are not at fault, tell them to involve a trusted adult, preserve evidence, do not pay or negotiate, and use official reporting/support channels. For financial fraud, put calling 1930 and the bank first if money is moving or was just transferred. For threats of physical harm, prioritise getting to a safe place and contacting local emergency services. For bullying/harassment, suggest preserving evidence, blocking/reporting when appropriate and involving a trusted adult. Do not claim to have filed anything or contacted authorities. Do not invent facts, case numbers or laws. End with a gentle question unless the safest action is an immediate emergency instruction. Return JSON only with keys reply and journey; journey must be exactly urgent, standard, or status. Conversation:\n${transcript}` });
      try {
        const result = parseJson<{ reply: string; journey: Journey }>(response.output_text);
        if (!['urgent', 'standard', 'status'].includes(result.journey)) result.journey = 'standard';
        return NextResponse.json(result);
      } catch { return NextResponse.json(localChat(messages)); }
    }
    if (operation === 'triage') {
      const response = await client.responses.create({ model, store: false, input: `Classify this citizen cyber-safety message into exactly one journey. urgent = money is being taken, a financial transfer is happening now, or a very recent financial fraud where immediate action matters; status = an existing complaint/status request; standard = everything else. Never invent facts. Return JSON only with keys journey and reason. Message: ${safeText(body.story)}` });
      const result = parseJson<{ journey: Journey; reason: string }>(response.output_text);
      if (!['urgent', 'standard', 'status'].includes(result.journey)) throw new Error('Invalid AI journey');
      return NextResponse.json(result);
    }
    if (operation === 'draft') {
      const payload = { story: safeText(body.story), amount: safeText(body.amount), approximateTime: safeText(body.approximateTime), platform: safeText(body.platform) };
      const response = await client.responses.create({ model, store: false, input: `Draft a cybercrime complaint summary from only stated facts. Missing facts must be "We don't know this yet." Never invent a transaction ID, suspect identity, bank, time, amount or evidence. Return JSON only with keys summary, suspected, financialLoss, amount, approximateIncidentType, possibleEvidence, missing. Data: ${JSON.stringify(payload)}` });
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
