import type { EvidenceItem, EvidenceType } from '../types/models';

export function createEvidence(type: EvidenceType, content: string): EvidenceItem {
  return { id: crypto.randomUUID(), type, label: type.replaceAll('_', ' '), content, signals: extractSignals(content) };
}

export function extractSignals(content: string): Record<string, string> {
  const signals: Record<string, string> = {};
  const phone = content.match(/(?:\+91[- ]?)?[6-9]\d{9}/);
  const upi = content.match(/[a-z0-9._-]+@[a-z][a-z0-9.-]+/i);
  const url = content.match(/https?:\/\/[^\s]+|www\.[^\s]+/i);
  const amount = content.match(/(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
  if (phone) signals.phone = phone[0];
  if (upi) signals.upi = upi[0];
  if (url) signals.url = url[0];
  if (amount) signals.amount = `₹${amount[1]}`;
  return signals;
}
