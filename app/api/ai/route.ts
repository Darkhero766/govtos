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
  const users = messages.filter(m => m.role === 'user').map(m => m.content.trim());
  const value = users.at(-1) || '';
  const context = users.join(' ').toLowerCase();
  const t = value.toLowerCase();

  const intimate = /(nude|naked|intimate|private (photo|video|pic|image)|mms|sextort|sextortion|blackmail|leak|leaking|morphed|deepfake|न्यूड|निजी फोटो|ब्लैकमेल)/i.test(context);
  const financialFraud = /(money (was|has been|is|got|just)? ?(sent|transferred|debited|taken|lost)|upi fraud|upi scam|bank fraud|fraudulent (transaction|transfer)|i (paid|transferred|sent) .*\b(rupee|rs|₹)|otp.*(shared|gave|told)|scammed .*money|पैसे (कट|गए|भेज|गए हैं)|पैसे ठगे)/i.test(context);
  const physicalThreat = /(kill|hurt me|come to my house|find me|physical harm|जान से|मारने|घर आने)/i.test(context);
  const hacked = /(account hacked|hacked|locked out|login changed|password changed|someone logged in|अकाउंट हैक)/i.test(context);
  const greeting = /^(hi|hey|hello|hii|namaste|yo|good morning|good evening|नमस्ते|हाय)\b/i.test(t);

  if (greeting && users.length === 1) {
    return { journey: 'standard', reply: 'Hey 👋 I’m First Response. You don’t need the right words. Tell me what happened online, in your own words, and I’ll help you figure out the next step.' };
  }

  if (physicalThreat) {
    return { journey: 'standard', reply: 'I’m glad you told me. If you think someone may hurt you in person, get somewhere safe and stay with someone you trust. Contact local emergency services if the danger is immediate. Keep the threatening messages and don’t meet or confront the person alone. Are you in immediate physical danger right now?' };
  }

  // Context wins: a demand for payment during blackmail is NOT treated as a banking/UPI fraud.
  if (intimate) {
    return { journey: 'standard', reply: 'I’m really sorry. If someone is threatening to share intimate photos or videos, **don’t pay and don’t negotiate** — paying usually doesn’t make the threat stop. Don’t delete the chat. Save screenshots, the profile and message links, and keep the original messages if possible. Block/report them after you’ve preserved the evidence, and tell someone you trust. If anyone involved is under 18, involve a trusted adult immediately and use the official cybercrime reporting route. If you tell me which app this is happening on, I can help you with the safest next step.' };
  }

  if (financialFraud) {
    return { journey: 'urgent', reply: 'If money was just transferred or is still moving, act now: **call 1930**, contact your bank through its official number/app, and ask them to stop or flag the transaction. Don’t share another OTP, PIN or password. Keep the transaction details and screenshots. After you’ve made those calls, come back here and I’ll help you organise the incident details.' };
  }

  if (hacked) {
    return { journey: 'standard', reply: 'Let’s secure the account before anything else. Use the app’s official recovery page, change the password from a device you trust, sign out other sessions if the option exists, and turn on two-step verification. Don’t share OTPs or recovery codes here. Which app or account was taken over?' };
  }

  if (/(password|pin|cvv|aadhaar|pan|account number|पासवर्ड|ओटीपी|पिन)/i.test(t)) {
    return { journey: 'standard', reply: 'Please keep that secret private — don’t send the actual password, OTP, PIN, CVV or ID number here. You can describe what someone asked you to do without giving me the secret itself. What were they asking you to do?' };
  }

  if (/(threat|bully|bullying|harass|stalk|threatening|धमकी|परेशान|ब्लैकमेल)/i.test(context)) {
    return { journey: 'standard', reply: 'You did the right thing by telling someone. Keep the messages, screenshots and profile/link as evidence. Don’t argue with or threaten the person back. You can block/report them after saving what you need, and tell someone you trust. What happened most recently?' };
  }

  return { journey: 'standard', reply: 'That’s okay — you can explain it badly. I’ll help you sort it out. What happened, which app or website was involved, and what are you most worried will happen next?' };
}

const SYSTEM_GUIDE = `You are First Response, a warm, highly capable Indian cyber-safety guide for children, teenagers, parents and adults who are confused or frightened online.

Conversation rules:
- Treat the entire conversation as ONE incident. Never reset to a generic greeting/question just because the latest message is short (for example, “he is asking me to pay” should be understood using earlier messages).
- Start by acknowledging the latest message naturally. Sound like a calm, caring human helper, not a government form, lawyer, call-centre script or generic AI assistant.
- Give 2–3 concrete actions, in priority order. Keep each action short and practical.
- Ask exactly ONE follow-up question only when the answer would materially change the next step. If you already have enough information, do not ask a redundant question.
- Never blame, shame or scare the person. Do not promise an outcome.
- Never ask for Aadhaar, PAN, OTP, passwords, CVV, bank PIN, recovery codes, exact home address, or intimate images/videos.
- Never ask a child to secretly meet, confront or negotiate with an offender.

Safety routing:
- Intimate-image abuse/sexual blackmail: do NOT confuse a demand for money with financial fraud. Say not to pay or negotiate, preserve evidence, tell a trusted adult, and report/block after preserving evidence. If the person is under 18, explicitly involve a trusted adult and use official reporting/support channels.
- Financial fraud: if money was transferred, debited, or is moving because of a scam/fraud, put 1930 and the bank first. Do not tell someone to keep chatting before taking that urgent action.
- Physical threats: prioritise getting somewhere safe and contacting local emergency services when danger is immediate.
- Bullying/harassment: preserve evidence, involve a trusted person, and use block/report tools when appropriate.
- Account takeover: secure the account through its official recovery flow, change password, revoke sessions if available, and enable two-step verification.
- Never claim to have filed a complaint, contacted police/bank, or checked a private database.
- Do not invent case numbers, transaction IDs, laws, deadlines, suspects or facts.
- You may use simple Indian English and occasional Hindi/Hinglish if the person does. Do not overdo emojis; at most one when it feels natural.
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
        input: `${SYSTEM_GUIDE}\n\nConversation so far:\n${transcript}\n\nRespond to the latest Person message while preserving all relevant context.`,
      });
      try {
        const result = parseJson<{ reply: string; journey: Journey }>(response.output_text);
        if (!result.reply || !['urgent', 'standard', 'status'].includes(result.journey)) throw new Error('Invalid chat result');
        return NextResponse.json({ reply: result.reply.slice(0, 5000), journey: result.journey });
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
