import type { ScamSignature } from '../types/models';
import { mockSignatures } from './mockSignatures';

export type ScamResult = { result: 'MATCH' | 'NOT FOUND' | 'INCONCLUSIVE'; message: string; signature?: ScamSignature };

export function scamCheck(input: string): ScamResult {
  const value = input.trim().toLowerCase();
  if (value.length < 4) return { result: 'INCONCLUSIVE', message: 'Add a URL, UPI ID, phone number, message, or pasted scam content.' };

  // Accept a full pasted message/URL instead of requiring an exact single-token match.
  const match = mockSignatures.find((sig) => value.includes(sig.value.toLowerCase()));
  if (match) return { result: 'MATCH', message: `${match.label}: ${match.risk_reason}`, signature: match };

  const kind = value.includes('@') ? 'UPI ID / payment handle' : /^\+?\d[\d\s()-]{7,}$/.test(value) ? 'phone number' : /https?:\/\//.test(value) || value.includes('.') ? 'URL / domain' : 'text / message';
  return { result: 'NOT FOUND', message: `No matching synthetic signature was found for this ${kind}. This is only a demonstration dataset — NOT FOUND does not mean safe.` };
}
