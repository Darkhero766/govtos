import type { HistoricalCase, IncidentType } from '../types/models';

const types: IncidentType[] = ['financial_fraud', 'suspicious_message', 'account_access'];

// 180 deterministic synthetic rows. No real case data is used.
export const syntheticHistoricalCases: HistoricalCase[] = Array.from({ length: 180 }, (_, index) => {
  const incidentType = types[index % types.length];
  const variation = (index * 7) % 5;
  const base = incidentType === 'financial_fraud' ? 1 : incidentType === 'suspicious_message' ? 2 : 2;
  const daysToReview = base + (variation % 2);
  const daysToAction = daysToReview + 2 + ((index * 3) % 4);
  const daysToOutcome = daysToAction + 6 + ((index * 5) % 7);
  return { id: `synthetic-${index + 1}`, incidentType, daysToReview, daysToAction, daysToOutcome };
});
