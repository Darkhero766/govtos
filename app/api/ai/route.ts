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
function safeText(value: unknown, maxLength = 4000): string { return typeof value === 'string' ? value.slice(0, maxLength) : ''; }
function compactReply(value: unknown): string {
  const text = typeof value === 'string' ? value.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim() : '';
  return (text || 'I’m here with you. Tell me what happened and I’ll help with the next step.').slice(0, 900);
}

function localChat(messages: ChatMessage[]): { reply: string; journey: Journey } {
  const users = messages.filter(m => m.role === 'user').map(m => m.content.trim());
  const value = users.at(-1) || '';
  const context = users.join(' ').toLowerCase();
  const t = value.toLowerCase();
  const intimate = /(nude|naked|intimate|private (photo|video|pic|image)|mms|sextort|sextortion|blackmail|leak|leaking|morphed|deepfake|न्यूड|निजी फोटो|ब्लैकमेल)/i.test(context);
  const money = /(money|payment|paid|upi|bank|transfer|debited|fraud|scam|otp.*shared|पैसे|भुगतान|ठगी)/i.test(context);
  const physical = /(kill|hurt me|come to my house|physical harm|जान से|मारने|घर आने)/i.test(context);
  const hacked = /(account hacked|hacked|locked out|login changed|password changed|someone logged in|अकाउंट हैक)/i.test(context);
  const selfHarm = /(want to die|kill myself|suicide|self harm|hurt myself|don't want to live|जीना नहीं|मरना|खुद को नुकसान)/i.test(context);
  const distress = /(can't cope|cant cope|hopeless|worthless|panic|panicking|scared|terrified|overwhelmed|घबराहट)/i.test(context);
  const greeting = /^(hi|hey|hello|hii|namaste|yo|good morning|good evening|नमस्ते|हाय)\b/i.test(t);
  const appName = /^(instagram|insta|whatsapp|facebook|snapchat|telegram|youtube|discord|x|twitter|unknown)$/i.test(t.trim());
  const wantsReport = /(report|complaint|file|cybercrime\.gov|report करना|शिकायत)/i.test(t);

  if (selfHarm) return { journey: 'standard', reply: 'I’m really glad you told me. Please stay with someone you trust and move away from anything you could use to hurt yourself. If you may act on this now, call 112 or go to the nearest emergency department. You do not have to handle this alone. Are you in immediate danger right now?' };
  if (physical) return { journey: 'standard', reply: 'Your safety comes first. Get somewhere safe and stay with someone you trust. If the danger is immediate, call 112. Keep the threatening messages and don’t meet or confront the person alone.' };
  if (intimate && appName) return { journey: 'standard', reply: `Got it — ${value.trim()} is involved. Don’t pay or negotiate. Save screenshots, the profile/username and message links, then use ${value.trim()}’s report/block tools. I can also help you prepare the information for an official cybercrime complaint. If you’re under 18, tell a trusted adult now.` };
  if (intimate && wantsReport) return { journey: 'standard', reply: 'Yes — I can help you prepare the report. Keep screenshots, the profile/username, message links, dates/times and any payment demand you already have. Don’t include passwords, OTPs or intimate images here. I can turn what you’ve told me into a clear incident summary for the official reporting portal.' };
  if (intimate) return { journey: 'standard', reply: 'I’m sorry this is happening. Don’t pay or negotiate, and don’t delete the chat. Save screenshots and profile/message links, then block/report after preserving the evidence. Tell someone you trust; if you’re under 18, tell a trusted adult now. Which app is this on?' };
  if (money) return { journey: 'urgent', reply: 'If money was just sent or is still moving, call 1930 and your bank now. Don’t share another OTP, PIN or password. Save transaction details and screenshots. Once you’ve made those calls, I can help organise the complaint.' };
  if (hacked) return { journey: 'standard', reply: 'Secure the account first: use its official recovery page, change the password, sign out other sessions if available, and turn on two-step verification. Don’t share recovery codes here. Tell me the app name and I’ll give you the next step.' };
  if (/(password|pin|cvv|aadhaar|pan|account number|पासवर्ड|ओटीपी|पिन)/i.test(t)) return { journey: 'standard', reply: 'Please keep that information private. Don’t send the actual password, OTP, PIN, CVV or ID number here. Tell me what someone asked you to do without sharing the secret itself.' };
  if (/(threat|bully|bullying|harass|stalk|threatening|धमकी|परेशान|ब्लैकमेल)/i.test(context)) return { journey: 'standard', reply: 'You did the right thing by telling someone. Keep the messages, screenshots and profile link. Don’t argue or threaten them back. Block/report after saving the evidence, and tell someone you trust. If you want, I can help turn this into a clear report.' };
  if (distress) return { journey: 'standard', reply: 'That sounds really overwhelming. You don’t need to solve everything at once. Stay with someone you trust if you can, and we’ll take one small step at a time. What happened most recently?' };
  if (greeting && users.length === 1) return { journey: 'standard', reply: 'Hey 👋 I’m here with you. Tell me what happened online, in your own words. You don’t need to know the right category.' };
  return { journey: 'standard', reply: 'That’s okay — you don’t have to explain it perfectly. Tell me what happened most recently and what you’re most worried about.' };
}

const SYSTEM_GUIDE = `You are First Response, a calm Indian cyber-safety guide for children, teenagers, parents and adults who feel confused, scared or stuck online.

Treat the whole conversation as ONE incident. Use earlier messages when interpreting short follow-ups. Never restart the conversation unnecessarily.

STYLE:
- Sound like a caring, practical human helper — not a form, lawyer, call-centre script or generic AI.
- Keep every reply to 2–4 short sentences, normally under 90 words.
- Give at most 3 concrete actions, with the most important first.
- Ask only ONE follow-up question, and only when it changes the next action.
- Acknowledge fear, shame, panic or overwhelm briefly without overdoing it.
- Never blame, shame, frighten or lecture. Never promise an outcome.
- Never ask for Aadhaar, PAN, OTP, passwords, CVV, bank PIN, recovery codes, exact home address, or intimate images/videos.

CYBER ACTIONS:
- Financial fraud: if money was transferred, debited or is moving, call 1930 and the bank first. Then help organise evidence and the complaint.
- Intimate-image blackmail: never treat a payment demand as banking fraud. Tell them not to pay/negotiate, preserve evidence, tell a trusted person, then block/report. If under 18, involve a trusted adult immediately.
- Bullying/harassment: preserve messages/screenshots/profile links, tell a trusted person, then block/report.
- Account takeover: official recovery, password change, revoke sessions, 2FA.
- Physical danger: get somewhere safe; call 112 if immediate.

REPORTING HELP:
- When the person wants to report, explain what information to collect: what happened, platform, username/profile link, dates/times, screenshots and transaction details they already have.
- Help write a concise factual incident summary using ONLY information they provided.
- Do not claim to file anything. Actual filing must happen through official government channels.
- Never ask the person to upload intimate images into this chat.

MENTAL WELL-BEING:
- If frightened, ashamed, panicking or overwhelmed: reassure briefly and reduce the task to one next step.
- If suicidal/self-harm thoughts or inability to stay safe appear: prioritise immediate safety, staying with a trusted person and calling 112/going to an emergency department if danger is immediate. Ask only whether they are in immediate danger. Do not provide methods or graphic detail.
- Do not diagnose or pretend to be a therapist.

LANGUAGE:
- Match simple English, Hindi or Hinglish when appropriate. Keep Hindi natural.
- At most one emoji when useful.

Return JSON only: {"reply":"...","journey":"urgent|standard|status"}.`;

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
        ? body.messages.slice(-20).map((m: { role?: string; content?: unknown }) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: safeText(m.content, 1200) }))
        : [];
      const transcript = messages.map(m => `${m.role === 'assistant' ? 'First Response' : 'Person'}: ${m.content}`).join('\n');
      const response = await client.responses.create({ model, store: false, input: `${SYSTEM_GUIDE}\n\nConversation:\n${transcript}\n\nReply to the latest Person message. Preserve incident context. Keep it concise, practical and emotionally safe.` });
      try {
        const result = parseJson<{ reply: string; journey: Journey }>(response.output_text);
        if (!result.reply || !['urgent', 'standard', 'status'].includes(result.journey)) throw new Error('Invalid chat result');
        return NextResponse.json({ reply: compactReply(result.reply), journey: result.journey });
      } catch { return NextResponse.json(localChat(messages)); }
    }
    if (operation === 'triage') {
      const response = await client.responses.create({ model, store: false, input: `Classify this cyber-safety incident into exactly one journey. urgent = money is being taken/transferred or recent financial fraud needing immediate action; status = existing complaint/status request; standard = everything else. Intimate-image blackmail with a payment demand is standard unless there is a separate financial fraud. Return JSON only with journey and a short reason. Message: ${safeText(body.story)}` });
      const result = parseJson<{ journey: Journey; reason: string }>(response.output_text);
      if (!['urgent', 'standard', 'status'].includes(result.journey)) throw new Error('Invalid journey');
      return NextResponse.json(result);
    }
    if (operation === 'draft') {
      const payload = { story: safeText(body.story), amount: safeText(body.amount), approximateTime: safeText(body.approximateTime), platform: safeText(body.platform) };
      const response = await client.responses.create({ model, store: false, input: `Create a concise cybercrime complaint summary using ONLY stated facts. Missing facts must say "We don't know this yet." Never invent names, IDs, banks, dates, amounts or evidence. Return JSON only with keys summary, suspected, financialLoss, amount, approximateIncidentType, possibleEvidence, missing. Data: ${JSON.stringify(payload)}` });
      return NextResponse.json(parseJson(response.output_text));
    }
    if (operation === 'scamReason') {
      const payload = { query: safeText(body.query), result: safeText(body.result), signal: safeText(body.signal) };
      const response = await client.responses.create({ model, store: false, input: `Explain this deterministic scam-signature result in 60 words or fewer. Never change MATCH, NOT FOUND or INCONCLUSIVE. NOT FOUND does not mean safe. Return JSON only: {"explanation":"..."}. Data: ${JSON.stringify(payload)}` });
      return NextResponse.json(parseJson<{ explanation: string }>(response.output_text));
    }
    return NextResponse.json({ error: 'Unknown AI operation.' }, { status: 400 });
  } catch (error) {
    console.error('AI route error', error);
    if (operation === 'chat') return NextResponse.json(localChat(Array.isArray(body.messages) ? body.messages : []));
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 });
  }
}
