import type { ScamSignature } from '../types/models';
export const mockSignatures: ScamSignature[] = [
  { kind: 'upi', value: 'refund-help@upi', label: 'demo refund impersonation UPI' },
  { kind: 'phone', value: '+919999999999', label: 'demo fake bank caller' },
  { kind: 'url', value: 'https://demo-bank-help.example', label: 'demo fake bank support URL' },
];
