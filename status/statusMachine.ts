import type { HistoricalCase, IncidentType, StatusEvent, StatusState } from '../types/models';

export const statusOrder: StatusState[] = ['received', 'cyber_cell', 'outcome'];

function relevantCases(history: HistoricalCase[], incidentType: IncidentType) {
  const matching = history.filter((item) => item.incidentType === incidentType);
  return matching.length ? matching : history;
}

export function calculateTypicalRange(history: HistoricalCase[], incidentType: IncidentType): { min: number; max: number } {
  const cases = relevantCases(history, incidentType);
  const totals = cases.map((item) => item.daysToOutcome);
  return { min: Math.min(...totals), max: Math.max(...totals) };
}

export function buildStatusTimeline(history: HistoricalCase[], incidentType: IncidentType = 'financial_fraud', currentDay = 6): StatusEvent[] {
  const cases = relevantCases(history, incidentType);
  const reviewDay = Math.max(1, Math.round(cases.reduce((sum, item) => sum + item.daysToReview, 0) / cases.length));
  const actionDay = Math.max(reviewDay + 1, Math.round(cases.reduce((sum, item) => sum + item.daysToAction, 0) / cases.length));
  const range = calculateTypicalRange(history, incidentType);

  return [
    { state: 'received', title: 'RECEIVED', meaning: 'Your mock complaint has been recorded in this prototype.', next: 'The details are checked and prepared for the cyber cell.', citizenAction: 'Keep your original evidence safe.', simulatedDay: 0 },
    { state: 'cyber_cell', title: 'WITH CYBER CELL', meaning: 'In this simulation, the complaint is with the team that reviews cyber incidents.', next: `Typical cases like this take ${range.min}–${range.max} days overall.`, citizenAction: 'You do not need to submit the same report again.', simulatedDay: Math.max(currentDay, actionDay) },
    { state: 'outcome', title: 'OUTCOME SHARED', meaning: 'The simulated journey has reached its outcome.', next: 'A plain-language outcome note would be shown here.', citizenAction: 'Review the outcome and keep your evidence.', simulatedDay: range.max },
  ];
}
