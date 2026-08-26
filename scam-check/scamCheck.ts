import type { ScamSignature } from '../types/models';
import { mockSignatures } from './mockSignatures';

export type ScamResult = { result: 'MATCH' | 'NOT FOUND' | 'INCONCLUSIVE'; message: string; signature?: ScamSignature };

const highRiskPatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(nudes?|naked|intimate|private photos?|private video|sex tape)\b/i, label: 'intimate-content threat' },
  { pattern: /\b(blackmail|extort|pay me|send money|transfer|upi|ransom)\b/i, label: 'financial or extortion language' },
  { pattern: /\b(threaten|threatening|threat|leak|viral|expose|publish|share this)\b/i, label: 'threat or exposure language' },
  { pattern: /\b(otp|password|pin|cvv|bank account|verification code)\b/i, label: 'credential or payment request' },
];

export function scamCheck(input: string): ScamResult {
  const value = input.trim().toLowerCase();
  if (value.length < 4) return { result: 'INCONCLUSIVE', message: 'Add a URL, UPI ID, phone number, message, or pasted scam content.' };

  // Exact synthetic signatures still take priority.
  const match = mockSignatures.find((sig) => value.includes(sig.value.toLowerCase()));
  if (match) return { result: 'MATCH', message: `${match.label}: ${match.risk_reason}`, signature: match };

  // A long message can be dangerous even when it is not present in the demo signature dataset.
  const risks = highRiskPatterns.filter(({ pattern }) => pattern.test(value)).map(({ label }) => label);
  if (risks.length > 0) {
    const uniqueRisks = [...new Set(risks)];
    return {
      result: 'INCONCLUSIVE',
      message: `Potential risk detected: ${uniqueRisks.join(', ')}. No exact database signature matched, so this needs human review — do not treat this result as proof that the message is safe.`,
    };
  }

  const kind = value.includes('@') ? 'UPI ID / payment handle' : /^\+?\d[\d\s()-]{7,}$/.test(value) ? 'phone number' : /https?:\/\//.test(value) || value.includes('.') ? 'URL / domain' : 'text / message';
  return { result: 'NOT FOUND', message: `No matching database signature was found for this ${kind}. This is only a demonstration dataset — NOT FOUND does not mean safe.` };
}
