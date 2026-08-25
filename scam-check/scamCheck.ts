import type { ScamSignature } from '../types/models';
import { mockSignatures } from './mockSignatures';

export type ScamResult = { result: 'MATCH' | 'NOT FOUND' | 'INCONCLUSIVE'; message: string; signature?: ScamSignature };

export function scamCheck(input: string): ScamResult {
  const value = input.trim().toLowerCase();
  if (value.length < 4) return { result: 'INCONCLUSIVE', message: 'Not enough information for the demonstration dataset.' };
  const match = mockSignatures.find((sig) => sig.value.toLowerCase() === value);
  if (match) return { result: 'MATCH', message: `${match.label}: ${match.risk_reason}`, signature: match };
  return { result: 'NOT FOUND', message: 'We did not find this in our demonstration dataset. This does not mean safe.' };
}
