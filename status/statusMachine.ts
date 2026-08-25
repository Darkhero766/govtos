import type { HistoricalCase, StatusEvent, StatusState } from '../types/models';

export const statusOrder: StatusState[] = ['received', 'reviewing', 'action', 'outcome'];

export function buildStatusTimeline(history: HistoricalCase[]): StatusEvent[] {
  const avg = (key: keyof HistoricalCase) => Math.max(1, Math.round(history.reduce((sum, item) => sum + Number(item[key]), 0) / Math.max(1, history.length)));
  return [
    { state: 'received', title: 'RECEIVED', meaning: 'Your mock report has been recorded in this prototype.', next: 'The details are checked for completeness.', citizenAction: 'Keep evidence safe and do not submit duplicate mock reports.', simulatedDay: 0 },
    { state: 'reviewing', title: 'REVIEWING', meaning: 'The report is being reviewed. You do not need to submit it again.', next: 'If more detail is needed, the next step would ask for it.', citizenAction: 'Add missing evidence if you have it.', simulatedDay: avg('daysToReview') },
    { state: 'action', title: 'ACTION / INVESTIGATION', meaning: 'Further action is being taken in this simulated journey.', next: 'The case moves toward an outcome.', citizenAction: 'Stay reachable and preserve original evidence.', simulatedDay: avg('daysToAction') },
    { state: 'outcome', title: 'OUTCOME', meaning: "Here's what happened next in the simulated status history.", next: 'The citizen can review the closure note.', citizenAction: 'No immediate action in the demo.', simulatedDay: avg('daysToOutcome') },
  ];
}
