import type { IncidentType, Journey } from '../types/models';

export interface TriageResult { journey: Journey; incidentType: IncidentType; label: string; confidence: 'high' | 'medium' | 'low'; }

export function classifyWithRules(text: string): TriageResult {
  const value = text.toLowerCase();
  if (/already|complaint|reported|status|track/.test(value)) return { journey: 'status', incidentType: 'prior_report', label: 'already reported complaint', confidence: 'high' };
  if (/money|bank|upi|transferred|account|debit|₹|rs\.?|inr|paid|payment|wallet/.test(value)) return { journey: 'urgent', incidentType: 'financial_fraud', label: 'possible financial cyber fraud', confidence: 'high' };
  if (/sms|message|link|url|whatsapp|email|otp|call/.test(value)) return { journey: 'standard', incidentType: 'suspicious_message', label: 'suspicious message or contact', confidence: 'medium' };
  if (value.trim().length < 8) return { journey: 'standard', incidentType: 'unknown', label: 'not enough information yet', confidence: 'low' };
  return { journey: 'standard', incidentType: 'unknown', label: 'cyber incident that needs details', confidence: 'low' };
}

export function overrideTriage(journey: Journey): TriageResult {
  const map = { urgent: 'something is happening right now', standard: 'something happened', status: 'already reported complaint' } as const;
  return { journey, incidentType: journey === 'urgent' ? 'financial_fraud' : journey === 'status' ? 'prior_report' : 'unknown', label: map[journey], confidence: 'high' };
}
