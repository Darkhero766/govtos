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
function compactReply(value: unknown): string {
  const text = typeof value === 'string' ? value.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim() : '';
  if (!text) return 'I’m here with you. Tell me what happened and I’ll help with the next step.';
  return text.slice(0, 900);
}

function localChat(messages: ChatMessage[]): { reply: string; journey: Journey } {
  const users = messages.filter(m => m.role === 'user').map(m => m.content.trim());
  const value = users.at(-1) || '';
  const context = users.join(' ').toLowerCase();
  const t = value.toLowerCase();

  const intimate = /(nude|naked|intimate|private (photo|video|pic|image)|mms|sextort|sextortion|blackmail|leak|leaking|morphed|deepfake|न्यूड|निजी फोटो|ब्लैकमेल)/i.test(context);
  const financialFraud = /(money (was|has been|is|got|just)? ?(sent|transferred|debited|taken|lost)|upi fraud|upi scam|bank fraud|fraudulent (transaction|transfer)|i (paid|transferred|sent) .*\b(rupee|rs|₹)|otp.*(shared|gave|told)|scammed .*money|पैसे (कट|गए|भेज|गए हैं)|पैसे ठगे)/i.test(context);
  const physicalThreat = /(kill|hurt me|come to my house|find me|physical harm|जान से|मारने|घर आने)/i.test(context);
  const hacked = /(account hacked|hacked|locked out|login changed|password changed|someone logged in|अकाउंट हैक)/i.test(context);
  const distress = /(can't cope|cant cope|hopeless|worthless|panic|panicking|scared|terrified|want to die|kill myself|suicide|self harm|hurt myself|जीना नहीं|मरना|खुद को नुकसान)/i.test(context);
  const greeting = /^(hi|hey|hello|hii|namaste|yo|good morning|good evening|नमस्ते|हाय)\b/i.test(t);

  if (distress && /(die|suicide|self harm|hurt myself|जीना नहीं|मरना|खुद को नुकसान)/i.test(context)) {
    return { journey: 'standard', reply: 'I’m really glad you told me. Please stay with someone you trust and move away from anything you could use to hurt yourself. If you may act on this now, contact local emergency services or go to the nearest emergency department. You do not have to handle this alone.' };
  }
  if (greeting && users.length === 1) {
    return { journey: 'standard', reply: 'Hey 👋 I’m here with you. Tell me what happened online, in your own words. You don’t need to know the right category.' };
  }
  if (physicalThreat) {
    return { journey: 'standard', reply: 'I’m glad you told me. If you may be hurt in person, get somewhere safe and stay with someone you trust. Contact local emergency services if the danger is immediate. Keep the threats and don’t meet the person alone. Are you in immediate danger?' };
  }
  if (intimate) {
    return { journey: 'standard', reply: 'I’m sorry this is happening. Don’t pay or negotiate, and don’t delete the chat. Save screenshots and the profile/message links, then tell someone you trust. If you’re under 18, tell a trusted adult now. Which app is this on?' };
  }
  if (financialFraud) {
    return { journey: 'urgent', reply: 'If money was just sent or is still moving, call 1930 and your bank now. Don’t share another OTP, PIN or password. Save the transaction details and screenshots. Come back after those calls and I’ll help organise the next steps.' };
  }
  if (hacked) {
    return { journey: 'standard', reply: 'Let’s secure the account first. Use the app’s official recovery page, change the password, sign out other sessions if available, and turn on two-step verification. Don’t share recovery codes here. Which app was taken over?' };
  }
  if (/(password|pin|cvv|aadhaar|pan|account number|पासवर्ड|ओटीपी|पिन)/i.test(t)) {
    return { journey: 'standard', reply: 'Please keep that secret private. Don’t send the password, OTP, PIN, CVV or ID number here. Tell me what someone asked you to do without sharing the secret itself.' };
  }
  if (/(threat|bully|bullying|harass|stalk|threatening|धमकी|परेशान|ब्लैकमेल)/i.test(context)) {
    return { journey: 'standard', reply: 'You did the right thing by telling someone. Keep the messages, screenshots and profile link. Don’t argue or threaten them back. Block/report after saving the evidence, and tell someone you trust. What happened most recently?' };
  }
  if (distress) {
    return { journey: 'standard', reply: 'That sounds really overwhelming. Take one step at a time and stay with someone you trust if you can. I can help with the online problem too. What happened most recently?' };
  }
  return { journey: 'standard', reply: 'That’s okay — you don’t have to explain it perfectly. Tell me what happened and what you’re most worried about right now.' };
}

const SYSTEM_GUIDE = `You are First Response, a warm Indian cyber-safety guide for children, teenagers, parents and adults who feel confused, scared or stuck online.

Conversation rules:
- Treat the entire conversation as ONE incident. Never reset to a generic question because the latest message is short. Use earlier messages as context.
- Reply like a calm, caring human helper. Do not sound like a form, lawyer, call-centre script or generic AI.
- Keep every reply SHORT: ideally 2–4 sentences and under 90 words. Give no more than 3 actions.
- Put the most important action first. Use plain Indian English or simple Hindi/Hinglish when appropriate.
- Acknowledge the person's feelings briefly when they are scared, ashamed, bullied, blackmailed or overwhelmed.
- Ask EXACTLY ONE follow-up question only if it changes what they should do next. Otherwise give the next step and stop.
- Never blame, shame, frighten or lecture the person. Never promise an outcome.
- Never ask for Aadhaar, PAN, OTP, passwords, CVV, bank PIN, recovery codes, exact home address, or intimate images/videos.
- Never ask a child to secretly meet, confront or negotiate with an offender.

Safety:
- Intimate-image abuse/sexual blackmail: do NOT confuse a demand for money with financial fraud. Say not to pay or negotiate, preserve evidence, tell a trusted adult, and report/block after preserving evidence. If under 18, explicitly involve a trusted adult.
- Financial fraud: if money was transferred, debited, or is moving because of a scam, put 1930 and the bank first.
- Physical threats: prioritise getting somewhere safe and contacting local emergency services when danger is immediate.
- Bullying/harassment: preserve evidence, involve a trusted person, and block/report when appropriate.
- Account takeover: use the official recovery flow, change password, revoke sessions if available, and enable two-step verification.
- If the person expresses self-harm or suicidal thoughts, respond with warmth, encourage staying with a trusted person and contacting local emergency services or the nearest emergency department if they may act now. Do not make promises or attempt therapy.
- Never claim to have filed a complaint, contacted police/bank, or checked a private database.
- Never invent case numbers, transaction IDs, laws, deadlines, suspects or facts.
- Return JSON only with keys reply and journey. journey must be exactly urgent, standard, or status.`;

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
        ? body.messages.slice(-16).map((m: { role?: string; content?: unknown }): ChatMessage => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: safeText(m.content) }))
        : [];
      const transcript = messages.map(m => `${m.role === 'assistant' ? 'First Response' : 'Person'}: ${m.content}`).join('\n');
      const response = await client.responses.create({
        model,
        store: false,
        input: `${SYSTEM_GUIDE}\n\nConversation so far:\n${transcript}\n\nRespond only to the latest Person message while preserving relevant context. Keep it short and actionable.`,
      });
      try {
        const result = parseJson<{ reply: string; journey: Journey }>(response.output_text);
        if (!result.reply || !['urgent', 'standard', 'status'].includes(result.journey)) throw new Error('Invalid chat result');
        return NextResponse.json({ reply: compactReply(result.reply), journey: result.journey });
      } catch { return NextResponse.json(localChat(messages)); }
    }
    if (operation === 'triage') {
      const response = await client.responses.create({ model, store: false, input: `Classify this citizen cyber-safety message into exactly one journey. urgent = money is being taken, a financial transfer is happening now, or a very recent financial fraud where immediate action matters; status = an existing complaint/status request; standard = everything else. A demand for payment in intimate-image blackmail is standard, not urgent, unless there is also a separate financial scam. Never invent facts. Return JSON only with keys journey and reason. Message: ${safeText(body.story)}` });
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
