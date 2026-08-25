import type { EvidenceItem, TimelineEvent } from '../types/models';

export function buildTimeline(story: string, evidence: EvidenceItem[]): TimelineEvent[] {
  const events: TimelineEvent[] = [{ id: 'started', time: 'Now', description: 'Report started', source: 'system' }];
  if (/call|called/i.test(story)) events.unshift({ id: 'call', time: 'Earlier', description: 'Suspicious call received', source: 'ai-draft' });
  if (/shared|otp|password|pin/i.test(story)) events.push({ id: 'shared', time: 'Earlier', description: 'Information may have been shared', source: 'ai-draft' });
  evidence.forEach((item, index) => events.push({ id: item.id, time: `Evidence ${index + 1}`, description: `${item.label} added`, source: 'citizen' }));
  return events;
}

export function editTimelineEvent(events: TimelineEvent[], id: string, patch: Partial<Pick<TimelineEvent, 'time' | 'description'>>): TimelineEvent[] {
  return events.map((event) => event.id === id ? { ...event, ...patch, source: 'citizen' } : event);
}
