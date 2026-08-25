import type { IncidentDraft } from '../types/models';
import { classifyWithRules } from '../triage/triageRules';

const UNKNOWN = "We don't know this yet.";

export function extractIncidentDraft(story: string): IncidentDraft {
  const triage = classifyWithRules(story);
  const amountMatch = story.match(/(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
  const possibleEvidence: string[] = [];
  if (/call|called|phone/i.test(story)) possibleEvidence.push('phone number or call log');
  if (/sms|message|whatsapp|chat/i.test(story)) possibleEvidence.push('message or chat screenshot');
  if (/upi|bank|transfer|transaction|debit|paid/i.test(story)) possibleEvidence.push('transaction screenshot or bank notification');
  return {
    suspected: /bank/i.test(story) ? 'suspected impersonation' : triage.label,
    financialLoss: triage.incidentType === 'financial_fraud' ? 'yes' : 'unknown',
    amount: amountMatch ? `₹${amountMatch[1]}` : UNKNOWN,
    approximateIncidentType: triage.incidentType,
    possibleEvidence: possibleEvidence.length ? possibleEvidence : [UNKNOWN],
    missing: ['exact transaction ID', 'confirmed bank/payment platform', 'suspect identity'].filter(Boolean),
  };
}

export const emptyDraft: IncidentDraft = { suspected: UNKNOWN, financialLoss: 'unknown', amount: UNKNOWN, approximateIncidentType: 'unknown', possibleEvidence: [UNKNOWN], missing: ['incident details'] };
