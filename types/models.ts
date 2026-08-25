export type Journey = 'urgent' | 'standard' | 'status';
export type IncidentType = 'financial_fraud' | 'suspicious_message' | 'account_access' | 'prior_report' | 'unknown';
export type EvidenceType = 'transaction_screenshot' | 'sms' | 'phone' | 'upi' | 'url' | 'chat_screenshot' | 'email' | 'notes';
export type StatusState = 'received' | 'reviewing' | 'action' | 'outcome';

export interface Complaint {
  id: string;
  journey: Journey;
  incidentType: IncidentType;
  story: string;
  amount?: string;
  approximateTime?: string;
  platform?: string;
  approved: boolean;
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  label: string;
  content: string;
  signals: Record<string, string>;
}

export interface TimelineEvent {
  id: string;
  time: string;
  description: string;
  source: 'citizen' | 'ai-draft' | 'system';
}

export interface StatusEvent {
  state: StatusState;
  title: string;
  meaning: string;
  next: string;
  citizenAction: string;
  simulatedDay: number;
}

export interface HistoricalCase { id: string; incidentType: IncidentType; daysToReview: number; daysToAction: number; daysToOutcome: number; }
export interface ScamSignature { kind: 'url' | 'upi' | 'phone'; value: string; label: string; }
export interface IncidentDraft {
  suspected: string;
  financialLoss: 'yes' | 'no' | 'unknown';
  amount: string;
  approximateIncidentType: IncidentType;
  possibleEvidence: string[];
  missing: string[];
}
