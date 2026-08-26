export type CaseSignal = {
  id: string;
  identifier: string;
  kind: 'phone' | 'upi' | 'url' | 'email' | 'social';
  category: string;
  reports: number;
  firstReported: string;
  lastReported: string;
  patterns: string[];
  source: string;
};

/** Seeded public-demo signals. These are not official police records. */
export const publicCaseSignals: CaseSignal[] = [
  { id: 'sig-001', identifier: '1800-555-0198', kind: 'phone', category: 'Fake customer support', reports: 17, firstReported: '2026-08-02', lastReported: '2026-08-25', patterns: ['Refund request', 'Screen-sharing app', 'UPI collection request'], source: 'First Response demo dataset' },
  { id: 'sig-002', identifier: 'refund-help@upi', kind: 'upi', category: 'Payment/refund scam', reports: 9, firstReported: '2026-08-11', lastReported: '2026-08-24', patterns: ['Refund lure', 'QR-code payment request'], source: 'First Response demo dataset' },
  { id: 'sig-003', identifier: 'kyc-update-sbi.xyz', kind: 'url', category: 'KYC phishing', reports: 23, firstReported: '2026-07-29', lastReported: '2026-08-26', patterns: ['KYC urgency', 'Bank impersonation', 'Credential capture'], source: 'First Response demo dataset' },
  { id: 'sig-004', identifier: '@support_india_help', kind: 'social', category: 'Impersonation', reports: 12, firstReported: '2026-08-06', lastReported: '2026-08-25', patterns: ['Brand impersonation', 'DM payment request'], source: 'First Response demo dataset' },
  { id: 'sig-005', identifier: 'safeparcel-check.example', kind: 'url', category: 'Parcel phishing', reports: 8, firstReported: '2026-08-15', lastReported: '2026-08-23', patterns: ['Delivery fee', 'Card details request'], source: 'First Response demo dataset' },
];
