import type { HistoricalCase } from '../types/models';
export const syntheticHistoricalCases: HistoricalCase[] = [
  { id: 'demo-1', incidentType: 'financial_fraud', daysToReview: 1, daysToAction: 3, daysToOutcome: 12 },
  { id: 'demo-2', incidentType: 'suspicious_message', daysToReview: 2, daysToAction: 5, daysToOutcome: 15 },
  { id: 'demo-3', incidentType: 'account_access', daysToReview: 1, daysToAction: 4, daysToOutcome: 10 },
];
